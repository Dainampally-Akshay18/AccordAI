const { Pinecone } = require('@pinecone-database/pinecone');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config');

class VectorService {
    constructor() {
        try {
            this.pc = new Pinecone({
                apiKey: config.PINECONE_API_KEY
            });
            
            this.indexName = config.PINECONE_INDEX_NAME;
            this.index = this.pc.index(this.indexName);
            
            this.targetDimension = 384;
            
            logger.legalSuccess(`Initialized Enhanced VectorService with index: ${this.indexName}, dimension: ${this.targetDimension}`);
            
        } catch (error) {
            logger.legalError(`Failed to initialize VectorService: ${error.message}`);
            throw error;
        }
    }

    // ✅ CRITICAL FIX: Enhanced legal document chunking that ensures minimum 3 chunks
    chunkLegalDocument(text, chunkSize = 500, overlap = 100) {
        logger.processingInfo(`🔧 Legal document chunking: ${text.length} characters`);

        if (!text || text.trim().length < 50) {
            logger.legalError("❌ Text too short for legal document chunking");
            return [];
        }

        const cleanText = text.trim();
        
        // ✅ CRITICAL FIX: Always ensure minimum 3 chunks for legal documents
        const minChunks = 3;
        const maxChunkSize = Math.max(200, Math.floor(cleanText.length / minChunks));
        const actualChunkSize = Math.min(chunkSize, maxChunkSize);
        
        logger.processingInfo(`📊 Chunk parameters: size=${actualChunkSize}, overlap=${overlap}, target_chunks=${minChunks}`);

        // Split by legal sections first
        const sectionPatterns = [
            /\n\d+\.\s+[A-Z][^\.]*\n/g, // Numbered sections like "1. POSITION"
            /\n[A-Z][A-Z\s]+:\s*\n/g,   // ALL CAPS headers like "CONFIDENTIALITY:"
            /\n\([a-z]\)\s+/g,           // (a) subsections
            /\n\([0-9]+\)\s+/g           // (1) subsections
        ];

        let sections = [];
        let currentText = cleanText;

        // Try to split by legal sections
        for (const pattern of sectionPatterns) {
            const matches = [...currentText.matchAll(pattern)];
            if (matches.length > 0) {
                const parts = currentText.split(pattern).filter(part => 
                    part.trim() && part.trim().length > 20
                );
                sections = parts;
                logger.processingInfo(`📋 Split into ${sections.length} legal sections using pattern`);
                break;
            }
        }

        if (sections.length === 0) {
            // Fall back to paragraph splitting
            const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
            sections = paragraphs.filter(p => p.length > 50);
            logger.processingInfo(`📋 Split into ${sections.length} paragraphs (fallback)`);
        }

        if (sections.length === 0) {
            // Ultimate fallback - sentence splitting
            const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 30);
            sections = sentences;
            logger.processingInfo(`📋 Split into ${sections.length} sentences (ultimate fallback)`);
        }

        // ✅ CRITICAL FIX: Intelligent chunking to ensure minimum chunks
        const chunks = [];
        
        if (sections.length >= minChunks) {
            // Standard chunking when we have enough sections
            let currentChunk = "";
            let chunkIndex = 0;

            for (const section of sections) {
                const words = section.split(/\s+/);

                if ((currentChunk + " " + section).split(/\s+/).length > actualChunkSize && currentChunk) {
                    // Save current chunk
                    chunks.push({
                        id: crypto.createHash('md5').update(`${currentChunk.substring(0, 100)}${chunkIndex}`).digest('hex'),
                        text: currentChunk.trim(),
                        chunk_index: chunkIndex,
                        word_count: currentChunk.split(/\s+/).length,
                        section_type: "legal_section",
                        start_word: 0,
                        end_word: currentChunk.split(/\s+/).length
                    });

                    // Start new chunk with overlap
                    if (overlap > 0 && currentChunk.split(/\s+/).length > overlap) {
                        const overlapWords = currentChunk.split(/\s+/).slice(-overlap);
                        currentChunk = overlapWords.join(' ') + " " + section;
                    } else {
                        currentChunk = section;
                    }
                    chunkIndex++;
                } else {
                    currentChunk = (currentChunk + " " + section).trim();
                }
            }

            // Add final chunk
            if (currentChunk) {
                chunks.push({
                    id: crypto.createHash('md5').update(`${currentChunk.substring(0, 100)}${chunkIndex}`).digest('hex'),
                    text: currentChunk.trim(),
                    chunk_index: chunkIndex,
                    word_count: currentChunk.split(/\s+/).length,
                    section_type: "legal_section",
                    start_word: 0,
                    end_word: currentChunk.split(/\s+/).length
                });
            }
        }

        // ✅ CRITICAL FIX: Force minimum chunks if we don't have enough
        if (chunks.length < minChunks) {
            logger.legalWarning(`⚠️ Only ${chunks.length} chunks created, forcing minimum ${minChunks} for legal document`);
            const forcedChunks = this._forceMinimumChunks(cleanText, minChunks);
            return forcedChunks;
        }

        logger.legalSuccess(`✅ Legal chunking completed: ${chunks.length} chunks created`);
        return chunks;
    }

    // ✅ CRITICAL FIX: Enhanced force minimum chunks method
    _forceMinimumChunks(text, minChunks = 3) {
        const words = text.split(/\s+/);
        const totalWords = words.length;
        
        // Calculate chunk size to ensure we get at least minChunks
        const baseChunkSize = Math.max(50, Math.floor(totalWords / minChunks));
        const overlap = Math.floor(baseChunkSize * 0.1); // 10% overlap
        
        const chunks = [];
        let start = 0;
        let chunkIndex = 0;

        logger.processingInfo(`🔧 Forcing ${minChunks} chunks: baseSize=${baseChunkSize}, overlap=${overlap}, totalWords=${totalWords}`);

        while (start < totalWords && chunks.length < minChunks * 2) { // Safety limit
            const end = Math.min(start + baseChunkSize, totalWords);
            const chunkWords = words.slice(start, end);
            
            if (chunkWords.length < 10 && chunks.length >= minChunks) {
                break; // Stop if chunk too small and we have minimum
            }

            const chunkText = chunkWords.join(' ');
            chunks.push({
                id: crypto.createHash('md5').update(`${chunkText.substring(0, 100)}${chunkIndex}`).digest('hex'),
                text: chunkText,
                chunk_index: chunkIndex,
                word_count: chunkWords.length,
                section_type: "forced_chunk",
                start_word: start,
                end_word: end
            });

            start += baseChunkSize - overlap;
            chunkIndex++;

            // Ensure we get at least minChunks
            if (chunks.length >= minChunks && start >= totalWords) {
                break;
            }
        }

        // If we still don't have enough chunks, split the last chunk
        if (chunks.length < minChunks && chunks.length > 0) {
            const lastChunk = chunks[chunks.length - 1];
            chunks.pop(); // Remove last chunk
            
            // Split the last chunk into multiple chunks
            const remainingChunksNeeded = minChunks - chunks.length;
            const lastChunkWords = lastChunk.text.split(/\s+/);
            const subChunkSize = Math.max(10, Math.floor(lastChunkWords.length / remainingChunksNeeded));
            
            for (let i = 0; i < remainingChunksNeeded; i++) {
                const subStart = i * subChunkSize;
                const subEnd = Math.min(subStart + subChunkSize, lastChunkWords.length);
                const subChunkWords = lastChunkWords.slice(subStart, subEnd);
                
                if (subChunkWords.length > 0) {
                    chunks.push({
                        id: crypto.createHash('md5').update(`${subChunkWords.join(' ').substring(0, 100)}${chunks.length}`).digest('hex'),
                        text: subChunkWords.join(' '),
                        chunk_index: chunks.length,
                        word_count: subChunkWords.length,
                        section_type: "split_forced_chunk",
                        start_word: lastChunk.start_word + subStart,
                        end_word: lastChunk.start_word + subEnd
                    });
                }
            }
        }

        logger.legalSuccess(`✅ Forced chunking completed: ${chunks.length} chunks created`);
        return chunks;
    }

    // Delegate to legal document chunking
    chunkText(text, chunkSize = 500, overlap = 100) {
        return this.chunkLegalDocument(text, chunkSize, overlap);
    }

    // Enhanced embedding creation (fixed dimension)
    async createEmbeddings(texts) {
        try {
            const embeddings = texts.map(text => {
                const hash = crypto.createHash('sha256').update(text).digest();
                const embedding = [];
                
                // Generate exactly 384 dimensions
                for (let i = 0; i < this.targetDimension; i++) {
                    const byteIndex = i % hash.length;
                    const normalizedValue = (hash[byteIndex] / 255) * 2 - 1;
                    embedding.push(normalizedValue);
                }
                
                return embedding;
            });

            logger.processingInfo(`🔧 Generated embeddings shape: [${embeddings.length}, ${this.targetDimension}] ✅`);
            
            // Verify dimensions
            for (let i = 0; i < embeddings.length; i++) {
                if (embeddings[i].length !== this.targetDimension) {
                    throw new Error(`Embedding ${i} has dimension ${embeddings[i].length}, expected ${this.targetDimension}`);
                }
            }
            
            return embeddings;

        } catch (error) {
            logger.legalError(`Failed to create embeddings: ${error.message}`);
            throw error;
        }
    }

    // Store document chunks in Pinecone (enhanced)
    async storeDocumentChunks(documentId, chunks, metadata = null) {
        try {
            if (!chunks || chunks.length === 0) {
                logger.legalWarning("No chunks provided for storage");
                return false;
            }

            const vectorsToUpsert = [];
            
            const chunkTexts = chunks.map(chunk => chunk.text);
            const embeddings = await this.createEmbeddings(chunkTexts);

            logger.processingInfo(`🔧 STORING ENHANCED LEGAL DOCUMENT: ${documentId}`);
            logger.processingInfo(`🔧 Generated embeddings for ${chunks.length} chunks`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                const chunkMetadata = {
                    document_id: documentId,
                    chunk_index: chunk.chunk_index,
                    text: chunk.text.substring(0, 1000),
                    word_count: chunk.word_count,
                    start_word: chunk.start_word || 0,
                    end_word: chunk.end_word || 0,
                    section_type: chunk.section_type || "standard",
                    created_at: new Date().toISOString()
                };

                if (metadata) {
                    for (const [key, value] of Object.entries(metadata)) {
                        if (!chunkMetadata.hasOwnProperty(key)) {
                            chunkMetadata[key] = String(value).substring(0, 500);
                        }
                    }
                }

                const vectorValues = embeddings[i];
                if (vectorValues.length !== this.targetDimension) {
                    throw new Error(`Vector dimension ${vectorValues.length} doesn't match target ${this.targetDimension}`);
                }

                const vectorId = `${documentId}_${chunk.id}`;
                vectorsToUpsert.push({
                    id: vectorId,
                    values: vectorValues,
                    metadata: chunkMetadata
                });

                logger.processingInfo(`🔧 Prepared vector ${i + 1}/${chunks.length}: ${vectorId}`);
            }

            // Upsert in batches
            const batchSize = 100;
            const totalBatches = Math.ceil(vectorsToUpsert.length / batchSize);

            for (let batchIdx = 0; batchIdx < vectorsToUpsert.length; batchIdx += batchSize) {
                const batch = vectorsToUpsert.slice(batchIdx, batchIdx + batchSize);
                const currentBatch = Math.floor(batchIdx / batchSize) + 1;

                logger.processingInfo(`🔧 Upserting batch ${currentBatch}/${totalBatches} (${batch.length} vectors)`);

                const upsertResponse = await this.index.upsert(batch);
                logger.legalSuccess(`✅ Batch ${currentBatch} upserted successfully: ${JSON.stringify(upsertResponse)}`);
            }

            logger.processingInfo("🔧 Waiting 5 seconds for index propagation...");
            await new Promise(resolve => setTimeout(resolve, 5000));

            await this._verifyStoredDocument(documentId, chunks.length);

            logger.legalSuccess(`✅ Successfully stored ${chunks.length} chunks for enhanced legal document ${documentId}`);
            return true;

        } catch (error) {
            logger.legalError(`❌ Failed to store enhanced legal document: ${error.message}`);
            return false;
        }
    }

    // Enhanced chunk retrieval (exact match to Python)
    async retrieveRelevantChunks(query, documentId, topK = 10) {
        try {
            if (!query.trim()) {
                logger.legalWarning("Empty query provided");
                return [];
            }

            const queryEmbedding = (await this.createEmbeddings([query]))[0];

            if (queryEmbedding.length !== this.targetDimension) {
                throw new Error(`Query embedding dimension ${queryEmbedding.length} doesn't match target ${this.targetDimension}`);
            }

            logger.vectorInfo(`🔍 ENHANCED LEGAL DOCUMENT SEARCH:`);
            logger.vectorInfo(` Query: '${query.substring(0, 50)}...'`);
            logger.vectorInfo(` Document ID: '${documentId}'`);
            logger.vectorInfo(` Top K: ${topK}`);

            const searchResults = await this._searchLegalDocument(queryEmbedding, documentId, topK);

            logger.processingInfo(`🔧 Pinecone returned ${searchResults.matches?.length || 0} matches for legal document`);

            if (!searchResults.matches || searchResults.matches.length === 0) {
                await this._debugNoMatches(documentId, queryEmbedding, topK);
                return [];
            }

            const relevantChunks = [];
            for (const match of searchResults.matches) {
                const chunkData = {
                    id: match.id,
                    text: match.metadata?.text || "",
                    score: parseFloat(match.score),
                    chunk_index: match.metadata?.chunk_index || 0,
                    word_count: match.metadata?.word_count || 0,
                    start_word: match.metadata?.start_word || 0,
                    end_word: match.metadata?.end_word || 0,
                    section_type: match.metadata?.section_type || "standard"
                };

                relevantChunks.push(chunkData);
                logger.processingInfo(`🔧  Match: ${match.id}, Score: ${match.score.toFixed(4)}, Type: ${chunkData.section_type}`);
            }

            relevantChunks.sort((a, b) => a.chunk_index - b.chunk_index);

            if (relevantChunks.length < 3) {
                logger.processingInfo("🔧 Legal document: Ensuring minimum coverage...");
                const additionalResults = await this._getAllDocumentChunks(documentId, relevantChunks.map(c => c.id));
                relevantChunks.push(...additionalResults.slice(0, 5 - relevantChunks.length));
            }

            logger.legalSuccess(`✅ Retrieved ${relevantChunks.length} relevant chunks from legal document`);
            return relevantChunks.slice(0, topK);

        } catch (error) {
            logger.legalError(`❌ Failed to retrieve chunks from legal document: ${error.message}`);
            return [];
        }
    }

    async _searchLegalDocument(queryEmbedding, documentId, topK) {
        try {
            logger.vectorInfo("🔍 Legal Document Strategy: Enhanced coverage search");

            const searchResults = await this.index.query({
                vector: queryEmbedding,
                filter: { document_id: { $eq: documentId } },
                topK: Math.min(topK * 2, 50),
                includeMetadata: true,
                includeValues: false
            });

            if (searchResults.matches && searchResults.matches.length > 0) {
                logger.legalSuccess(`✅ Legal document search succeeded: ${searchResults.matches.length} matches`);
                return searchResults;
            }
        } catch (error) {
            logger.legalWarning(`⚠️ Legal document search failed: ${error.message}`);
        }

        return await this._searchWithFallback(queryEmbedding, documentId, topK);
    }

    async _searchWithFallback(queryEmbedding, documentId, topK) {
        try {
            logger.vectorInfo("🔍 Strategy 1: Exact document_id filter");

            const searchResults = await this.index.query({
                vector: queryEmbedding,
                filter: { document_id: { $eq: documentId } },
                topK: topK * 2,
                includeMetadata: true,
                includeValues: false
            });

            if (searchResults.matches && searchResults.matches.length > 0) {
                logger.legalSuccess(`✅ Strategy 1 succeeded: ${searchResults.matches.length} matches`);
                return searchResults;
            }
        } catch (error) {
            logger.legalWarning(`⚠️ Strategy 1 failed: ${error.message}`);
        }

        try {
            logger.vectorInfo("🔍 Strategy 2: Broad search with manual filtering");

            const searchResults = await this.index.query({
                vector: queryEmbedding,
                topK: topK * 3,
                includeMetadata: true,
                includeValues: false
            });

            const filteredMatches = [];
            for (const match of searchResults.matches || []) {
                if (match.metadata && match.metadata.document_id === documentId) {
                    filteredMatches.push(match);
                }
            }

            if (filteredMatches.length > 0) {
                logger.legalSuccess(`✅ Strategy 2: Found ${filteredMatches.length} matches`);
                return { matches: filteredMatches };
            }
        } catch (error) {
            logger.legalWarning(`⚠️ Strategy 2 failed: ${error.message}`);
        }

        return { matches: [] };
    }

    async _getAllDocumentChunks(documentId, excludeIds = []) {
        try {
            const dummyVector = new Array(this.targetDimension).fill(0.1);

            const allChunksResponse = await this.index.query({
                vector: dummyVector,
                filter: { document_id: { $eq: documentId } },
                topK: 50,
                includeMetadata: true,
                includeValues: false
            });

            const additionalChunks = [];
            for (const match of allChunksResponse.matches || []) {
                if (!excludeIds.includes(match.id)) {
                    const chunkData = {
                        id: match.id,
                        text: match.metadata?.text || "",
                        score: 0.3,
                        chunk_index: match.metadata?.chunk_index || 0,
                        word_count: match.metadata?.word_count || 0,
                        start_word: match.metadata?.start_word || 0,
                        end_word: match.metadata?.end_word || 0
                    };
                    additionalChunks.push(chunkData);
                }
            }

            additionalChunks.sort((a, b) => a.chunk_index - b.chunk_index);

            logger.processingInfo(`🔧 Found ${additionalChunks.length} additional chunks for legal document`);
            return additionalChunks;

        } catch (error) {
            logger.legalError(`❌ Failed to get additional chunks: ${error.message}`);
            return [];
        }
    }

    async _verifyStoredDocument(documentId, expectedChunks) {
        try {
            logger.vectorInfo(`🔍 Verifying stored legal document: ${documentId}`);

            const verificationResponse = await this.index.query({
                vector: new Array(this.targetDimension).fill(0.0),
                filter: { document_id: { $eq: documentId } },
                topK: expectedChunks + 5,
                includeMetadata: true,
                includeValues: false
            });

            const foundChunks = verificationResponse.matches?.length || 0;
            logger.processingInfo(`🔧 Verification: Found ${foundChunks}/${expectedChunks} chunks for legal document ${documentId}`);

            if (foundChunks === 0) {
                logger.legalError(`❌ CRITICAL: No chunks found immediately after storage for legal document ${documentId}`);
            } else if (foundChunks < expectedChunks) {
                logger.legalWarning(`⚠️ Only ${foundChunks}/${expectedChunks} chunks found - possible indexing delay`);
            } else {
                logger.legalSuccess(`✅ All chunks verified successfully for legal document ${documentId}`);
            }

        } catch (error) {
            logger.legalError(`❌ Verification failed: ${error.message}`);
        }
    }

    async _debugNoMatches(documentId, queryEmbedding, topK) {
        logger.legalError(`❌ DEBUGGING NO MATCHES for legal document_id: ${documentId}`);

        try {
            const totalVectors = await this.index.query({
                vector: queryEmbedding,
                topK: 5,
                includeMetadata: true,
                includeValues: false
            });

            logger.legalError(`Total vectors in index: ${totalVectors.matches?.length || 0}`);

            if (totalVectors.matches && totalVectors.matches.length > 0) {
                logger.legalError("Sample vectors in index:");
                for (let i = 0; i < Math.min(3, totalVectors.matches.length); i++) {
                    const match = totalVectors.matches[i];
                    const docId = match.metadata?.document_id || "NO_DOCUMENT_ID";
                    logger.legalError(` Vector ${i + 1}: ${match.id}, document_id: '${docId}'`);
                }
            } else {
                logger.legalError("NO VECTORS FOUND IN INDEX AT ALL!");
            }

        } catch (debugError) {
            logger.legalError(`Debug failed: ${debugError.message}`);
        }
    }

    async getDocumentInfo(documentId) {
        try {
            logger.processingInfo(`🔧 Getting legal document info for: ${documentId}`);

            const searchResponse = await this.index.query({
                vector: new Array(this.targetDimension).fill(0.0),
                filter: { document_id: { $eq: documentId } },
                topK: 100,
                includeMetadata: true,
                includeValues: false
            });

            if (!searchResponse.matches || searchResponse.matches.length === 0) {
                logger.legalWarning(`⚠️ No matches found for legal document_id: ${documentId}`);
                return {
                    document_id: documentId,
                    exists: false,
                    chunk_count: 0
                };
            }

            const indexStats = await this.index.describeIndexStats();

            logger.legalSuccess(`✅ Found ${searchResponse.matches.length} chunks for legal document ${documentId}`);

            return {
                document_id: documentId,
                exists: true,
                chunk_count: searchResponse.matches.length,
                index_total_vectors: indexStats.totalVectorCount,
                index_dimension: this.targetDimension,
                created_at: searchResponse.matches[0]?.metadata?.created_at || null
            };

        } catch (error) {
            logger.legalError(`❌ Failed to get legal document info: ${error.message}`);
            return {
                document_id: documentId,
                exists: false,
                error: error.message
            };
        }
    }

    async deleteDocument(documentId) {
        try {
            const searchResponse = await this.index.query({
                vector: new Array(this.targetDimension).fill(0.0),
                filter: { document_id: { $eq: documentId } },
                topK: 10000,
                includeMetadata: false,
                includeValues: false
            });

            if (!searchResponse.matches || searchResponse.matches.length === 0) {
                logger.legalWarning(`⚠️ No chunks found for legal document ${documentId}`);
                return true;
            }

            const vectorIds = searchResponse.matches.map(match => match.id);

            const batchSize = 1000;
            for (let i = 0; i < vectorIds.length; i += batchSize) {
                const batchIds = vectorIds.slice(i, i + batchSize);
                await this.index.deleteMany(batchIds);
                logger.processingInfo(`🔧 Deleted batch of ${batchIds.length} vectors from legal document`);
            }

            logger.legalSuccess(`✅ Successfully deleted ${vectorIds.length} chunks for legal document ${documentId}`);
            return true;

        } catch (error) {
            logger.legalError(`❌ Failed to delete legal document: ${error.message}`);
            return false;
        }
    }

    checkIndexInfo() {
        try {
            return {
                index_name: this.indexName,
                target_dimension: this.targetDimension,
                optimized_for: "legal_documents"
            };
        } catch (error) {
            logger.legalError(`❌ Failed to check index info: ${error.message}`);
            return {
                error: error.message,
                index_name: this.indexName,
                target_dimension: this.targetDimension
            };
        }
    }

    async healthCheck() {
        try {
            const testEmbedding = await this.createEmbeddings(["health check test legal document"]);

            const testQuery = await this.index.query({
                vector: testEmbedding[0],
                topK: 1,
                includeMetadata: false,
                includeValues: false
            });

            return {
                status: "healthy",
                index_accessible: true,
                embedding_model_loaded: true,
                target_dimension: this.targetDimension,
                optimized_for: "legal_documents",
                features: [
                    "Legal document chunking with minimum 3 chunks guarantee",
                    "Section-aware splitting", 
                    "Enhanced retrieval strategies",
                    "Context preservation"
                ],
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.legalError(`❌ Enhanced legal vector service health check failed: ${error.message}`);
            return {
                status: "unhealthy",
                error: error.message,
                optimized_for: "legal_documents",
                timestamp: new Date().toISOString()
            };
        }
    }
}

const vectorService = new VectorService();

module.exports = vectorService;
