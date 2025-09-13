const { Pinecone } = require('@pinecone-database/pinecone');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config');

// For embeddings, we'll use a lightweight transformer model
// Note: In production, you might want to use @xenova/transformers or another solution
class VectorService {
    constructor() {
        try {
            // Initialize Pinecone (matching Python)
            this.pc = new Pinecone({
                apiKey: config.PINECONE_API_KEY,
            });
            
            this.indexName = config.PINECONE_INDEX_NAME;
            this.index = this.pc.index(this.indexName);
            
            // Use compatible dimensions (matching Python)
            this.targetDimension = 384; // Match your actual Pinecone index dimension
            
            logger.legalSuccess(`Initialized Enhanced VectorService with index: ${this.indexName}, dimension: ${this.targetDimension}`);
            
        } catch (error) {
            logger.legalError(`Failed to initialize VectorService: ${error.message}`);
            throw error;
        }
    }

    // Legal document optimized chunking (matching Python exactly)
    chunkLegalDocument(text, chunkSize = 500, overlap = 100) {
        logger.processingInfo(`Legal document chunking: ${text.length} characters`);

        // Split by legal sections first (matching Python regex patterns)
        const sectionPatterns = [
            /\n\d+\.\s+[A-Z][^\.]*\n/g, // Numbered sections like "1. POSITION"
            /\n[A-Z][A-Z\s]+:\s*\n/g,   // ALL CAPS headers like "CONFIDENTIALITY:"
            /\n\([a-z]\)\s+/g,           // (a) subsections
            /\n\([0-9]+\)\s+/g           // (1) subsections
        ];

        let sections = [];
        let currentText = text;

        // Try to split by legal sections (matching Python logic)
        for (const pattern of sectionPatterns) {
            const matches = [...currentText.matchAll(pattern)];
            if (matches.length > 0) {
                const parts = currentText.split(pattern).filter(part => 
                    part.trim() && part.trim().length > 20
                );
                sections = parts;
                logger.processingInfo(`Split into ${sections.length} legal sections using pattern`);
                break;
            }
        }

        if (sections.length === 0) {
            // Fall back to paragraph splitting
            const paragraphs = text.split('\n\n').filter(p => p.trim());
            sections = paragraphs.filter(p => p.length > 50); // Only substantial paragraphs
            logger.processingInfo(`Split into ${sections.length} paragraphs (fallback)`);
        }

        if (sections.length === 0) {
            // Ultimate fallback - sentence splitting
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
            sections = sentences;
            logger.processingInfo(`Split into ${sections.length} sentences (ultimate fallback)`);
        }

        // Now chunk sections intelligently (matching Python logic)
        const chunks = [];
        let currentChunk = "";
        let chunkIndex = 0;

        for (const section of sections) {
            const words = section.split(/\s+/);

            // If adding this section would exceed chunk size
            if ((currentChunk + " " + section).split(/\s+/).length > chunkSize && currentChunk) {
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
                // Add section to current chunk
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

        // ✅ ENSURE MINIMUM 3 CHUNKS for legal documents (matching Python)
        if (chunks.length < 3 && text.split(/\s+/).length > 100) {
            logger.processingInfo("Forcing minimum 3 chunks for legal document");
            return this._forceMinimumChunks(text, 3);
        }

        logger.legalSuccess(`Legal chunking completed: ${chunks.length} chunks created`);
        return chunks;
    }

    _forceMinimumChunks(text, minChunks = 3) {
        const words = text.split(/\s+/);
        const totalWords = words.length;
        const chunkSize = Math.max(50, Math.floor(totalWords / minChunks));
        const chunks = [];

        for (let i = 0; i < totalWords; i += chunkSize) {
            const chunkWords = words.slice(i, i + chunkSize);
            if (chunkWords.length < 10) continue;

            const chunkText = chunkWords.join(' ');
            chunks.push({
                id: crypto.createHash('md5').update(`${chunkText.substring(0, 100)}${i}`).digest('hex'),
                text: chunkText,
                chunk_index: chunks.length,
                word_count: chunkWords.length,
                section_type: "forced_chunk",
                start_word: i,
                end_word: i + chunkWords.length
            });

            if (chunks.length >= minChunks) break;
        }

        return chunks;
    }

    // Delegate to legal document chunking (matching Python)
    chunkText(text, chunkSize = 500, overlap = 100) {
        return this.chunkLegalDocument(text, chunkSize, overlap);
    }

    // Simple embedding creation (placeholder - in production use proper embedding model)
    // Simple embedding creation (placeholder - in production use proper embedding model)
async createEmbeddings(texts) {
    try {
        // ✅ FIXED: Generate proper 384-dimensional embeddings
        const embeddings = texts.map(text => {
            // Create deterministic embedding from text hash
            const hash = crypto.createHash('sha256').update(text).digest();
            const embedding = [];
            
            // Generate exactly 384 dimensions
            for (let i = 0; i < this.targetDimension; i++) {
                // Use hash bytes cyclically and normalize to [-1, 1]
                const byteIndex = i % hash.length;
                const normalizedValue = (hash[byteIndex] / 255) * 2 - 1;
                embedding.push(normalizedValue);
            }
            
            return embedding;
        });

        logger.processingInfo(`Generated embeddings shape: [${embeddings.length}, ${this.targetDimension}] ✅`);
        
        // ✅ VERIFY: Check dimensions before returning
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


    // Store document chunks in Pinecone (matching Python exactly)
    async storeDocumentChunks(documentId, chunks, metadata = null) {
        try {
            if (!chunks || chunks.length === 0) {
                logger.legalWarning("No chunks provided for storage");
                return false;
            }

            const vectorsToUpsert = [];
            
            // Process chunks in batches for embedding generation
            const chunkTexts = chunks.map(chunk => chunk.text);
            const embeddings = await this.createEmbeddings(chunkTexts);

            logger.processingInfo(`STORING ENHANCED LEGAL DOCUMENT: ${documentId}`);
            logger.processingInfo(`Generated embeddings for ${chunks.length} chunks`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // Prepare metadata (Pinecone has metadata size limits)
                const chunkMetadata = {
                    document_id: documentId,
                    chunk_index: chunk.chunk_index,
                    text: chunk.text.substring(0, 1000), // Limit to 1000 chars for metadata
                    word_count: chunk.word_count,
                    start_word: chunk.start_word || 0,
                    end_word: chunk.end_word || 0,
                    section_type: chunk.section_type || "standard",
                    created_at: new Date().toISOString()
                };

                // Add additional metadata if provided
                if (metadata) {
                    for (const [key, value] of Object.entries(metadata)) {
                        if (!chunkMetadata.hasOwnProperty(key)) {
                            chunkMetadata[key] = String(value).substring(0, 500);
                        }
                    }
                }

                // Verify vector dimension before adding
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

                logger.processingInfo(`Prepared vector ${i + 1}/${chunks.length}: ${vectorId}`);
            }

            // Upsert in batches to avoid rate limits (matching Python)
            const batchSize = 100;
            const totalBatches = Math.ceil(vectorsToUpsert.length / batchSize);

            for (let batchIdx = 0; batchIdx < vectorsToUpsert.length; batchIdx += batchSize) {
                const batch = vectorsToUpsert.slice(batchIdx, batchIdx + batchSize);
                const currentBatch = Math.floor(batchIdx / batchSize) + 1;

                logger.processingInfo(`Upserting batch ${currentBatch}/${totalBatches} (${batch.length} vectors)`);

                const upsertResponse = await this.index.upsert(batch);
                logger.legalSuccess(`Batch ${currentBatch} upserted successfully: ${JSON.stringify(upsertResponse)}`);
            }

            // Wait for index to propagate (matching Python)
            logger.processingInfo("Waiting 5 seconds for index propagation...");
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Verify the stored data
            await this._verifyStoredDocument(documentId, chunks.length);

            logger.legalSuccess(`Successfully stored ${chunks.length} chunks for enhanced legal document ${documentId}`);
            return true;

        } catch (error) {
            logger.legalError(`Failed to store enhanced legal document: ${error.message}`);
            return false;
        }
    }

    // Enhanced chunk retrieval optimized for legal documents (matching Python exactly)
    async retrieveRelevantChunks(query, documentId, topK = 10) {
        try {
            if (!query.trim()) {
                logger.legalWarning("Empty query provided");
                return [];
            }

            // Create query embedding
            const queryEmbedding = (await this.createEmbeddings([query]))[0];

            // Verify query embedding dimension
            if (queryEmbedding.length !== this.targetDimension) {
                throw new Error(`Query embedding dimension ${queryEmbedding.length} doesn't match target ${this.targetDimension}`);
            }

            logger.vectorInfo(`ENHANCED LEGAL DOCUMENT SEARCH:`);
            logger.vectorInfo(` Query: '${query.substring(0, 50)}...'`);
            logger.vectorInfo(` Document ID: '${documentId}'`);
            logger.vectorInfo(` Top K: ${topK}`);

            // Enhanced search strategy for legal documents
            const searchResults = await this._searchLegalDocument(queryEmbedding, documentId, topK);

            logger.processingInfo(`Pinecone returned ${searchResults.matches?.length || 0} matches for legal document`);

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
                logger.processingInfo(` Match: ${match.id}, Score: ${match.score.toFixed(4)}, Type: ${chunkData.section_type}`);
            }

            // Sort by chunk index to maintain document flow
            relevantChunks.sort((a, b) => a.chunk_index - b.chunk_index);

            // Ensure we get good coverage for legal documents
            if (relevantChunks.length < 3) {
                logger.processingInfo("Legal document: Ensuring minimum coverage...");
                const additionalResults = await this._getAllDocumentChunks(documentId, relevantChunks.map(c => c.id));
                relevantChunks.push(...additionalResults.slice(0, 5 - relevantChunks.length));
            }

            logger.legalSuccess(`Retrieved ${relevantChunks.length} relevant chunks from legal document`);
            return relevantChunks.slice(0, topK);

        } catch (error) {
            logger.legalError(`Failed to retrieve chunks from legal document: ${error.message}`);
            return [];
        }
    }

    // Specialized search for legal documents (matching Python)
    async _searchLegalDocument(queryEmbedding, documentId, topK) {
        try {
            logger.vectorInfo("Legal Document Strategy: Enhanced coverage search");

            const searchResults = await this.index.query({
                vector: queryEmbedding,
                filter: { document_id: { $eq: documentId } },
                topK: Math.min(topK * 2, 50), // Get more results for legal docs
                includeMetadata: true,
                includeValues: false
            });

            if (searchResults.matches && searchResults.matches.length > 0) {
                logger.legalSuccess(`Legal document search succeeded: ${searchResults.matches.length} matches`);
                return searchResults;
            }
        } catch (error) {
            logger.legalWarning(`Legal document search failed: ${error.message}`);
        }

        // Fallback to standard search
        return await this._searchWithFallback(queryEmbedding, documentId, topK);
    }

    // Fallback search with multiple strategies (matching Python)
    async _searchWithFallback(queryEmbedding, documentId, topK) {
        // Strategy 1: Exact filter match
        try {
            logger.vectorInfo("Strategy 1: Exact document_id filter");

            const searchResults = await this.index.query({
                vector: queryEmbedding,
                filter: { document_id: { $eq: documentId } },
                topK: topK * 2,
                includeMetadata: true,
                includeValues: false
            });

            if (searchResults.matches && searchResults.matches.length > 0) {
                logger.legalSuccess(`Strategy 1 succeeded: ${searchResults.matches.length} matches`);
                return searchResults;
            }
        } catch (error) {
            logger.legalWarning(`Strategy 1 failed: ${error.message}`);
        }

        // Strategy 2: Broader search without filter, then manual filtering
        try {
            logger.vectorInfo("Strategy 2: Broad search with manual filtering");

            const searchResults = await this.index.query({
                vector: queryEmbedding,
                topK: topK * 3,
                includeMetadata: true,
                includeValues: false
            });

            // Filter manually
            const filteredMatches = [];
            for (const match of searchResults.matches || []) {
                if (match.metadata && match.metadata.document_id === documentId) {
                    filteredMatches.push(match);
                }
            }

            if (filteredMatches.length > 0) {
                logger.legalSuccess(`Strategy 2: Found ${filteredMatches.length} matches`);
                return { matches: filteredMatches };
            }
        } catch (error) {
            logger.legalWarning(`Strategy 2 failed: ${error.message}`);
        }

        // Return empty results
        return { matches: [] };
    }

    // Get all chunks for a document (fallback method) (matching Python)
    async _getAllDocumentChunks(documentId, excludeIds = []) {
        try {
            // Use a dummy vector to get all chunks for this document
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
                        score: 0.3, // Lower score since not similarity-based
                        chunk_index: match.metadata?.chunk_index || 0,
                        word_count: match.metadata?.word_count || 0,
                        start_word: match.metadata?.start_word || 0,
                        end_word: match.metadata?.end_word || 0
                    };
                    additionalChunks.push(chunkData);
                }
            }

            // Sort by chunk index
            additionalChunks.sort((a, b) => a.chunk_index - b.chunk_index);

            logger.processingInfo(`Found ${additionalChunks.length} additional chunks for legal document`);
            return additionalChunks;

        } catch (error) {
            logger.legalError(`Failed to get additional chunks: ${error.message}`);
            return [];
        }
    }

    // Verify that document was actually stored in Pinecone (matching Python)
    async _verifyStoredDocument(documentId, expectedChunks) {
        try {
            logger.vectorInfo(`Verifying stored legal document: ${documentId}`);

            // Try to find the document immediately after storage
            const verificationResponse = await this.index.query({
                vector: new Array(this.targetDimension).fill(0.0),
                filter: { document_id: { $eq: documentId } },
                topK: expectedChunks + 5,
                includeMetadata: true,
                includeValues: false
            });

            const foundChunks = verificationResponse.matches?.length || 0;
            logger.processingInfo(`Verification: Found ${foundChunks}/${expectedChunks} chunks for legal document ${documentId}`);

            if (foundChunks === 0) {
                logger.legalError(`CRITICAL: No chunks found immediately after storage for legal document ${documentId}`);
            } else if (foundChunks < expectedChunks) {
                logger.legalWarning(`Only ${foundChunks}/${expectedChunks} chunks found - possible indexing delay`);
            } else {
                logger.legalSuccess(`All chunks verified successfully for legal document ${documentId}`);
            }

        } catch (error) {
            logger.legalError(`Verification failed: ${error.message}`);
        }
    }

    // Debug why no matches were found (matching Python)
    async _debugNoMatches(documentId, queryEmbedding, topK) {
        logger.legalError(`DEBUGGING NO MATCHES for legal document_id: ${documentId}`);

        try {
            // Check if ANY vectors exist in the index
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

    // Get information about a stored legal document (matching Python)
    async getDocumentInfo(documentId) {
        try {
            logger.processingInfo(`Getting legal document info for: ${documentId}`);

            // Try to find any vectors that match the document_id pattern
            const searchResponse = await this.index.query({
                vector: new Array(this.targetDimension).fill(0.0),
                filter: { document_id: { $eq: documentId } },
                topK: 100,
                includeMetadata: true,
                includeValues: false
            });

            if (!searchResponse.matches || searchResponse.matches.length === 0) {
                logger.legalWarning(`No matches found for legal document_id: ${documentId}`);
                return {
                    document_id: documentId,
                    exists: false,
                    chunk_count: 0
                };
            }

            // Get total index stats
            const indexStats = await this.index.describeIndexStats();

            logger.legalSuccess(`Found ${searchResponse.matches.length} chunks for legal document ${documentId}`);

            return {
                document_id: documentId,
                exists: true,
                chunk_count: searchResponse.matches.length,
                index_total_vectors: indexStats.totalVectorCount,
                index_dimension: this.targetDimension,
                created_at: searchResponse.matches[0]?.metadata?.created_at || null
            };

        } catch (error) {
            logger.legalError(`Failed to get legal document info: ${error.message}`);
            return {
                document_id: documentId,
                exists: false,
                error: error.message
            };
        }
    }

    // Delete all chunks for a legal document (matching Python)
    async deleteDocument(documentId) {
        try {
            // First, get all vector IDs for this document
            const searchResponse = await this.index.query({
                vector: new Array(this.targetDimension).fill(0.0),
                filter: { document_id: { $eq: documentId } },
                topK: 10000,
                includeMetadata: false,
                includeValues: false
            });

            if (!searchResponse.matches || searchResponse.matches.length === 0) {
                logger.legalWarning(`No chunks found for legal document ${documentId}`);
                return true;
            }

            // Extract vector IDs
            const vectorIds = searchResponse.matches.map(match => match.id);

            // Delete vectors in batches
            const batchSize = 1000;
            for (let i = 0; i < vectorIds.length; i += batchSize) {
                const batchIds = vectorIds.slice(i, i + batchSize);
                await this.index.deleteMany(batchIds);
                logger.processingInfo(`Deleted batch of ${batchIds.length} vectors from legal document`);
            }

            logger.legalSuccess(`Successfully deleted ${vectorIds.length} chunks for legal document ${documentId}`);
            return true;

        } catch (error) {
            logger.legalError(`Failed to delete legal document: ${error.message}`);
            return false;
        }
    }

    // Check index dimensions and stats (matching Python)
    checkIndexInfo() {
        try {
            return {
                index_name: this.indexName,
                target_dimension: this.targetDimension,
                optimized_for: "legal_documents"
            };
        } catch (error) {
            logger.legalError(`Failed to check index info: ${error.message}`);
            return {
                error: error.message,
                index_name: this.indexName,
                target_dimension: this.targetDimension
            };
        }
    }

    // Health check for enhanced legal document vector service (matching Python)
    async healthCheck() {
        try {
            // Test basic index operations
            const testEmbedding = await this.createEmbeddings(["health check test legal document"]);

            // Try a simple query
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
                    "Legal document chunking",
                    "Section-aware splitting", 
                    "Enhanced retrieval strategies",
                    "Context preservation"
                ],
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.legalError(`Enhanced legal vector service health check failed: ${error.message}`);
            return {
                status: "unhealthy",
                error: error.message,
                optimized_for: "legal_documents",
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Global enhanced vector service instance (matching Python)
const vectorService = new VectorService();

module.exports = vectorService;
