# vector_service.py - Enhanced with Legal Document Chunking & Lightweight Embeddings

import os
import numpy as np
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
import logging
from fastembed import TextEmbedding  # Lightweight replacement for sentence-transformers
import hashlib
from datetime import datetime
from app.config import settings
import time
import re

logger = logging.getLogger(__name__)

class VectorService:
    
    def __init__(self):
        # Use settings from config.py
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.index = self.pc.Index(self.index_name)
        
        # Use FastEmbed - lightweight ONNX-based embedding model
        # This replaces sentence-transformers with ~90% smaller memory footprint
        try:
            self.embedding_model = TextEmbedding(
                model_name="BAAI/bge-small-en-v1.5",  # Lightweight 384-dim model
                max_length=512,
                cache_dir="./models"  # Cache models locally
            )
            logger.info("✅ Initialized FastEmbed lightweight embedding model")
        except Exception as e:
            logger.warning(f"FastEmbed initialization failed: {e}, falling back to fallback embeddings")
            self.embedding_model = None
            
        self.target_dimension = 384  # Match your actual Pinecone index dimension
        
        logger.info(f"✅ Initialized Enhanced VectorService with index: {self.index_name}, dimension: {self.target_dimension}")

    def chunk_legal_document(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Legal document optimized chunking that preserves context and meaning
        """
        logger.info(f"📄 Legal document chunking: {len(text)} characters")
        
        # Split by legal sections first
        section_patterns = [
            r'\n\d+\.\s+[A-Z][^\.]*\n',  # Numbered sections like "1. POSITION"
            r'\n[A-Z][A-Z\s]+:\s*\n',    # ALL CAPS headers like "CONFIDENTIALITY:"
            r'\n\([a-z]\)\s+',            # (a) subsections
            r'\n\([0-9]+\)\s+'           # (1) subsections
        ]
        
        sections = []
        current_text = text
        
        # Try to split by legal sections
        for pattern in section_patterns:
            matches = list(re.finditer(pattern, current_text))
            if matches:
                parts = re.split(pattern, current_text)
                sections = [part.strip() for part in parts if part.strip() and len(part.strip()) > 20]
                logger.info(f"📋 Split into {len(sections)} legal sections using pattern")
                break
        
        if not sections:
            # Fall back to paragraph splitting
            paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
            sections = [p for p in paragraphs if len(p) > 50]  # Only substantial paragraphs
            logger.info(f"📋 Split into {len(sections)} paragraphs (fallback)")
            
        if not sections:
            # Ultimate fallback - sentence splitting
            sentences = re.split(r'[.!?]+', text)
            sections = [s.strip() for s in sentences if len(s.strip()) > 30]
            logger.info(f"📋 Split into {len(sections)} sentences (ultimate fallback)")
        
        # Now chunk sections intelligently
        chunks = []
        current_chunk = ""
        chunk_index = 0
        
        for section in sections:
            words = section.split()
            
            # If adding this section would exceed chunk size
            if len((current_chunk + " " + section).split()) > chunk_size and current_chunk:
                # Save current chunk
                chunks.append({
                    "id": hashlib.md5(f"{current_chunk[:100]}{chunk_index}".encode()).hexdigest(),
                    "text": current_chunk.strip(),
                    "chunk_index": chunk_index,
                    "word_count": len(current_chunk.split()),
                    "section_type": "legal_section",
                    "start_word": 0,  # Will be calculated later
                    "end_word": len(current_chunk.split())
                })
                
                # Start new chunk with overlap
                if overlap > 0 and len(current_chunk.split()) > overlap:
                    overlap_words = current_chunk.split()[-overlap:]
                    current_chunk = " ".join(overlap_words) + " " + section
                else:
                    current_chunk = section
                chunk_index += 1
            else:
                # Add section to current chunk
                current_chunk = (current_chunk + " " + section).strip()
        
        # Add final chunk
        if current_chunk:
            chunks.append({
                "id": hashlib.md5(f"{current_chunk[:100]}{chunk_index}".encode()).hexdigest(),
                "text": current_chunk.strip(),
                "chunk_index": chunk_index,
                "word_count": len(current_chunk.split()),
                "section_type": "legal_section",
                "start_word": 0,
                "end_word": len(current_chunk.split())
            })
        
        # ✅ ENSURE MINIMUM 3 CHUNKS for legal documents
        if len(chunks) < 3 and len(text.split()) > 100:
            logger.info("📝 Forcing minimum 3 chunks for legal document")
            # Re-chunk with smaller size
            return self._force_minimum_chunks(text, 3)
            
        logger.info(f"✅ Legal chunking completed: {len(chunks)} chunks created")
        return chunks

    def _force_minimum_chunks(self, text: str, min_chunks: int = 3) -> List[Dict[str, Any]]:
        """Force creation of minimum chunks"""
        words = text.split()
        total_words = len(words)
        chunk_size = max(50, total_words // min_chunks)
        
        chunks = []
        for i in range(0, total_words, chunk_size):
            chunk_words = words[i:i + chunk_size]
            if len(chunk_words) < 10:
                continue
                
            chunk_text = ' '.join(chunk_words)
            chunks.append({
                "id": hashlib.md5(f"{chunk_text[:100]}{i}".encode()).hexdigest(),
                "text": chunk_text,
                "chunk_index": len(chunks),
                "word_count": len(chunk_words),
                "section_type": "forced_chunk",
                "start_word": i,
                "end_word": i + len(chunk_words)
            })
            
            if len(chunks) >= min_chunks:
                break
                
        return chunks

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Enhanced text chunking - delegates to legal document chunking
        """
        return self.chunk_legal_document(text, chunk_size, overlap)

    def create_embeddings(self, texts: List[str]) -> np.ndarray:
        """Create embeddings with exact dimension matching using lightweight FastEmbed"""
        try:
            if not texts:
                raise ValueError("Empty text list provided")
            
            # Clean texts
            clean_texts = [str(text).strip() for text in texts if str(text).strip()]
            if not clean_texts:
                raise ValueError("No valid texts after cleaning")
            
            # Generate embeddings using FastEmbed
            if self.embedding_model is not None:
                # FastEmbed returns a generator, convert to list
                embeddings_gen = self.embedding_model.embed(clean_texts)
                embeddings = np.array(list(embeddings_gen))
                logger.debug(f"FastEmbed generated embeddings with shape: {embeddings.shape}")
            else:
                # Fallback: Simple TF-IDF based embeddings (ultra-lightweight)
                embeddings = self._create_fallback_embeddings(clean_texts)
                logger.debug(f"Fallback embeddings generated with shape: {embeddings.shape}")
            
            # Handle single embedding case
            if len(embeddings.shape) == 1:
                embeddings = embeddings.reshape(1, -1)
            
            # Get current dimensions
            current_dim = embeddings.shape[1]
            logger.debug(f"Generated embeddings with dimension: {current_dim}, target: {self.target_dimension}")
            
            # Ensure exact dimension match
            if current_dim != self.target_dimension:
                if current_dim < self.target_dimension:
                    # Pad with zeros if too small
                    padding = np.zeros((embeddings.shape[0], self.target_dimension - current_dim))
                    embeddings = np.hstack([embeddings, padding])
                    logger.debug(f"Padded embeddings to {self.target_dimension} dimensions")
                else:
                    # Truncate if too large
                    embeddings = embeddings[:, :self.target_dimension]
                    logger.debug(f"Truncated embeddings to {self.target_dimension} dimensions")
            
            # Verify final dimension
            final_dim = embeddings.shape[1]
            if final_dim != self.target_dimension:
                raise ValueError(f"Final embedding dimension {final_dim} doesn't match target {self.target_dimension}")
            
            logger.debug(f"Final embeddings shape: {embeddings.shape}")
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to create embeddings: {str(e)}")
            raise

    def _create_fallback_embeddings(self, texts: List[str]) -> np.ndarray:
        """Ultra-lightweight fallback embedding method using TF-IDF approach"""
        from collections import Counter
        import math
        
        # Build vocabulary from all texts
        all_words = []
        for text in texts:
            words = text.lower().split()
            all_words.extend(words)
        
        vocab = list(set(all_words))
        vocab_size = min(len(vocab), 300)  # Limit vocabulary size
        vocab = vocab[:vocab_size]
        
        # Create embeddings for each text
        embeddings = []
        
        for text in texts:
            words = text.lower().split()
            word_counts = Counter(words)
            
            # Create TF-IDF-like vector
            vector = []
            for word in vocab:
                tf = word_counts.get(word, 0) / len(words) if words else 0
                # Simple IDF approximation
                idf = math.log(len(texts) / max(1, sum(1 for t in texts if word in t.lower())))
                vector.append(tf * idf)
            
            # Pad to 300 dimensions if needed
            while len(vector) < 300:
                vector.append(0.0)
                
            embeddings.append(vector[:300])  # Truncate to 300
        
        return np.array(embeddings, dtype=np.float32)

    async def store_document_chunks(self, document_id: str, chunks: List[Dict[str, Any]], metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Store document chunks in Pinecone with enhanced debugging"""
        try:
            if not chunks:
                logger.warning("No chunks provided for storage")
                return False
                
            vectors_to_upsert = []
            
            # Process chunks in batches for embedding generation
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.create_embeddings(chunk_texts)
            
            logger.info(f"🔧 STORING ENHANCED LEGAL DOCUMENT: {document_id}")
            logger.info(f"📊 Generated embeddings shape: {embeddings.shape} for {len(chunks)} chunks")
            
            for i, chunk in enumerate(chunks):
                # Prepare metadata (Pinecone has metadata size limits)
                chunk_metadata = {
                    "document_id": document_id,
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"][:1000],  # Limit to 1000 chars for metadata
                    "word_count": chunk["word_count"],
                    "start_word": chunk.get("start_word", 0),
                    "end_word": chunk.get("end_word", 0),
                    "section_type": chunk.get("section_type", "standard"),
                    "created_at": datetime.now().isoformat()
                }
                
                # Add additional metadata if provided
                if metadata:
                    for key, value in metadata.items():
                        if key not in chunk_metadata:
                            chunk_metadata[key] = str(value)[:500]
                
                # Verify vector dimension before adding
                vector_values = embeddings[i].tolist()
                if len(vector_values) != self.target_dimension:
                    raise ValueError(f"Vector dimension {len(vector_values)} doesn't match target {self.target_dimension}")
                
                vector_id = f"{document_id}_{chunk['id']}"
                vectors_to_upsert.append({
                    "id": vector_id,
                    "values": vector_values,
                    "metadata": chunk_metadata
                })
                
                logger.info(f"📦 Prepared vector {i+1}/{len(chunks)}: {vector_id}")
            
            # Upsert in batches to avoid rate limits
            batch_size = 100
            total_batches = (len(vectors_to_upsert) + batch_size - 1) // batch_size
            
            for batch_idx in range(0, len(vectors_to_upsert), batch_size):
                batch = vectors_to_upsert[batch_idx:batch_idx + batch_size]
                current_batch = (batch_idx // batch_size) + 1
                
                logger.info(f"⬆️ Upserting batch {current_batch}/{total_batches} ({len(batch)} vectors)")
                
                upsert_response = self.index.upsert(
                    vectors=batch,
                    namespace=""
                )
                
                logger.info(f"✅ Batch {current_batch} upserted successfully: {upsert_response}")
            
            # Wait for index to propagate
            logger.info("⏳ Waiting 5 seconds for index propagation...")
            time.sleep(5)
            
            # Verify the stored data
            await self._verify_stored_document(document_id, len(chunks))
            
            logger.info(f"🎉 Successfully stored {len(chunks)} chunks for enhanced legal document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store enhanced legal document: {str(e)}")
            return False

    async def retrieve_relevant_chunks(self, query: str, document_id: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Enhanced chunk retrieval optimized for legal documents"""
        try:
            if not query.strip():
                logger.warning("Empty query provided")
                return []
            
            # Create query embedding
            query_embedding = self.create_embeddings([query])[0]
            
            # Verify query embedding dimension
            if len(query_embedding) != self.target_dimension:
                raise ValueError(f"Query embedding dimension {len(query_embedding)} doesn't match target {self.target_dimension}")
            
            logger.info(f"🔍 ENHANCED LEGAL DOCUMENT SEARCH:")
            logger.info(f"   Query: '{query[:50]}...'")
            logger.info(f"   Document ID: '{document_id}'")
            logger.info(f"   Top K: {top_k}")
            
            # Enhanced search strategy for legal documents
            search_results = await self._search_legal_document(query_embedding, document_id, top_k)
            
            logger.info(f"📊 Pinecone returned {len(search_results.matches)} matches for legal document")
            
            if len(search_results.matches) == 0:
                await self._debug_no_matches(document_id, query_embedding, top_k)
                return []
            
            relevant_chunks = []
            for match in search_results.matches:
                chunk_data = {
                    "id": match.id,
                    "text": match.metadata.get("text", ""),
                    "score": float(match.score),
                    "chunk_index": match.metadata.get("chunk_index", 0),
                    "word_count": match.metadata.get("word_count", 0),
                    "start_word": match.metadata.get("start_word", 0),
                    "end_word": match.metadata.get("end_word", 0),
                    "section_type": match.metadata.get("section_type", "standard")
                }
                relevant_chunks.append(chunk_data)
                logger.debug(f"   Match: {match.id}, Score: {match.score:.4f}, Type: {chunk_data['section_type']}")
            
            # Sort by chunk index to maintain document flow
            relevant_chunks.sort(key=lambda x: x["chunk_index"])
            
            # Ensure we get good coverage for legal documents
            if len(relevant_chunks) < 3:
                logger.info("📝 Legal document: Ensuring minimum coverage...")
                additional_results = await self._get_all_document_chunks(document_id, exclude_ids=[c["id"] for c in relevant_chunks])
                relevant_chunks.extend(additional_results[:5-len(relevant_chunks)])
            
            logger.info(f"✅ Retrieved {len(relevant_chunks)} relevant chunks from legal document")
            return relevant_chunks[:top_k]
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve chunks from legal document: {str(e)}")
            return []

    async def _search_legal_document(self, query_embedding, document_id: str, top_k: int):
        """Specialized search for legal documents"""
        # Strategy 1: Direct search with higher top_k for better coverage
        try:
            logger.info("🎯 Legal Document Strategy: Enhanced coverage search")
            
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                filter={"document_id": {"$eq": document_id}},
                top_k=min(top_k * 2, 50),  # Get more results for legal docs
                include_metadata=True,
                include_values=False,
                namespace=""
            )
            
            if search_results.matches:
                logger.info(f"✅ Legal document search succeeded: {len(search_results.matches)} matches")
                return search_results
                
        except Exception as e:
            logger.warning(f"⚠️ Legal document search failed: {str(e)}")
        
        # Fallback to standard search
        return await self._search_with_fallback(query_embedding, document_id, top_k)

    async def _search_with_fallback(self, query_embedding, document_id: str, top_k: int):
        """Fallback search with multiple strategies"""
        # Strategy 1: Exact filter match
        try:
            logger.info("🎯 Strategy 1: Exact document_id filter")
            
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                filter={"document_id": {"$eq": document_id}},
                top_k=top_k * 2,
                include_metadata=True,
                include_values=False,
                namespace=""
            )
            
            if search_results.matches:
                logger.info(f"✅ Strategy 1 succeeded: {len(search_results.matches)} matches")
                return search_results
                
        except Exception as e:
            logger.warning(f"⚠️ Strategy 1 failed: {str(e)}")
        
        # Strategy 2: Broader search without filter, then manual filtering
        try:
            logger.info("🎯 Strategy 2: Broad search with manual filtering")
            
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                top_k=top_k * 3,
                include_metadata=True,
                include_values=False,
                namespace=""
            )
            
            # Filter manually
            filtered_matches = []
            for match in search_results.matches:
                if match.metadata and match.metadata.get("document_id") == document_id:
                    filtered_matches.append(match)
            
            if filtered_matches:
                logger.info(f"✅ Strategy 2: Found {len(filtered_matches)} matches")
                search_results.matches = filtered_matches
                return search_results
                
        except Exception as e:
            logger.warning(f"⚠️ Strategy 2 failed: {str(e)}")
        
        # Return empty results
        from types import SimpleNamespace
        return SimpleNamespace(matches=[])

    async def _get_all_document_chunks(self, document_id: str, exclude_ids: List[str] = None) -> List[Dict[str, Any]]:
        """Get all chunks for a document (fallback method)"""
        try:
            exclude_ids = exclude_ids or []
            
            # Use a dummy vector to get all chunks for this document
            dummy_vector = [0.1] * self.target_dimension
            
            all_chunks_response = self.index.query(
                vector=dummy_vector,
                filter={"document_id": {"$eq": document_id}},
                top_k=50,
                include_metadata=True,
                namespace=""
            )
            
            additional_chunks = []
            for match in all_chunks_response.matches:
                if match.id not in exclude_ids:
                    chunk_data = {
                        "id": match.id,
                        "text": match.metadata.get("text", ""),
                        "score": 0.3,  # Lower score since not similarity-based
                        "chunk_index": match.metadata.get("chunk_index", 0),
                        "word_count": match.metadata.get("word_count", 0),
                        "start_word": match.metadata.get("start_word", 0),
                        "end_word": match.metadata.get("end_word", 0)
                    }
                    additional_chunks.append(chunk_data)
            
            # Sort by chunk index
            additional_chunks.sort(key=lambda x: x["chunk_index"])
            
            logger.info(f"📝 Found {len(additional_chunks)} additional chunks for legal document")
            return additional_chunks
            
        except Exception as e:
            logger.error(f"❌ Failed to get additional chunks: {str(e)}")
            return []

    async def _verify_stored_document(self, document_id: str, expected_chunks: int):
        """Verify that document was actually stored in Pinecone"""
        try:
            logger.info(f"🔍 Verifying stored legal document: {document_id}")
            
            # Try to find the document immediately after storage
            verification_response = self.index.query(
                vector=[0.0] * self.target_dimension,
                filter={"document_id": {"$eq": document_id}},
                top_k=expected_chunks + 5,
                include_metadata=True,
                namespace=""
            )
            
            found_chunks = len(verification_response.matches)
            logger.info(f"✅ Verification: Found {found_chunks}/{expected_chunks} chunks for legal document {document_id}")
            
            if found_chunks == 0:
                logger.error(f"❌ CRITICAL: No chunks found immediately after storage for legal document {document_id}")
            elif found_chunks < expected_chunks:
                logger.warning(f"⚠️ Only {found_chunks}/{expected_chunks} chunks found - possible indexing delay")
            else:
                logger.info(f"🎉 All chunks verified successfully for legal document {document_id}")
                
        except Exception as e:
            logger.error(f"❌ Verification failed: {str(e)}")

    async def _debug_no_matches(self, document_id: str, query_embedding, top_k: int):
        """Debug why no matches were found"""
        logger.error(f"🐛 DEBUGGING NO MATCHES for legal document_id: {document_id}")
        
        try:
            # Check if ANY vectors exist in the index
            total_vectors = self.index.query(
                vector=query_embedding.tolist(),
                top_k=5,
                include_metadata=True,
                namespace=""
            )
            
            logger.error(f"📊 Total vectors in index: {len(total_vectors.matches)}")
            
            if total_vectors.matches:
                logger.error("🔍 Sample vectors in index:")
                for i, match in enumerate(total_vectors.matches[:3]):
                    doc_id = match.metadata.get("document_id", "NO_DOCUMENT_ID") if match.metadata else "NO_METADATA"
                    logger.error(f"   Vector {i+1}: {match.id}, document_id: '{doc_id}'")
            else:
                logger.error("❌ NO VECTORS FOUND IN INDEX AT ALL!")
                
        except Exception as debug_error:
            logger.error(f"❌ Debug failed: {str(debug_error)}")

    async def get_document_info(self, document_id: str) -> Dict[str, Any]:
        """Get information about a stored legal document"""
        try:
            logger.info(f"📋 Getting legal document info for: {document_id}")
            
            # Try to find any vectors that match the document_id pattern
            search_response = self.index.query(
                vector=[0.0] * self.target_dimension,
                filter={"document_id": {"$eq": document_id}},
                top_k=100,
                include_metadata=True,
                namespace=""
            )
            
            if not search_response.matches:
                logger.warning(f"⚠️ No matches found for legal document_id: {document_id}")
                return {
                    "document_id": document_id,
                    "exists": False,
                    "chunk_count": 0
                }
            
            # Get total index stats
            index_stats = self.index.describe_index_stats()
            
            logger.info(f"✅ Found {len(search_response.matches)} chunks for legal document {document_id}")
            
            return {
                "document_id": document_id,
                "exists": True,
                "chunk_count": len(search_response.matches),
                "index_total_vectors": index_stats.total_vector_count,
                "index_dimension": self.target_dimension,
                "created_at": search_response.matches[0].metadata.get("created_at") if search_response.matches else None
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get legal document info: {str(e)}")
            return {
                "document_id": document_id,
                "exists": False,
                "error": str(e)
            }

    async def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a legal document"""
        try:
            # First, get all vector IDs for this document
            search_response = self.index.query(
                vector=[0.0] * self.target_dimension,
                filter={"document_id": {"$eq": document_id}},
                top_k=10000,
                include_metadata=False,
                namespace=""
            )
            
            if not search_response.matches:
                logger.warning(f"No chunks found for legal document {document_id}")
                return True
            
            # Extract vector IDs
            vector_ids = [match.id for match in search_response.matches]
            
            # Delete vectors in batches
            batch_size = 1000
            for i in range(0, len(vector_ids), batch_size):
                batch_ids = vector_ids[i:i + batch_size]
                self.index.delete(ids=batch_ids, namespace="")
                logger.info(f"Deleted batch of {len(batch_ids)} vectors from legal document")
            
            logger.info(f"Successfully deleted {len(vector_ids)} chunks for legal document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete legal document: {str(e)}")
            return False

    def check_index_info(self) -> Dict[str, Any]:
        """Check index dimensions and stats"""
        try:
            stats = self.index.describe_index_stats()
            
            # Get index configuration
            index_list = self.pc.list_indexes()
            index_info = None
            for idx in index_list:
                if idx.name == self.index_name:
                    index_info = idx
                    break
            
            return {
                "index_name": self.index_name,
                "total_vector_count": stats.total_vector_count,
                "dimension": index_info.dimension if index_info else "unknown",
                "metric": index_info.metric if index_info else "unknown", 
                "status": "ready" if index_info and index_info.status.ready else "not ready",
                "namespaces": stats.namespaces,
                "target_dimension": self.target_dimension,
                "optimized_for": "legal_documents",
                "embedding_engine": "FastEmbed_Lightweight"
            }
            
        except Exception as e:
            logger.error(f"Failed to check index info: {str(e)}")
            return {
                "error": str(e),
                "index_name": self.index_name,
                "target_dimension": self.target_dimension
            }

    async def health_check(self) -> Dict[str, Any]:
        """Health check for enhanced legal document vector service"""
        try:
            # Test basic index operations
            test_embedding = self.create_embeddings(["health check test legal document"])
            
            # Try a simple query
            test_query = self.index.query(
                vector=test_embedding[0].tolist(),
                top_k=1,
                include_metadata=False,
                namespace=""
            )
            
            return {
                "status": "healthy",
                "index_accessible": True,
                "embedding_model_loaded": self.embedding_model is not None,
                "embedding_engine": "FastEmbed" if self.embedding_model else "Fallback_TFIDF",
                "target_dimension": self.target_dimension,
                "optimized_for": "legal_documents",
                "memory_efficient": True,
                "features": [
                    "Legal document chunking",
                    "Section-aware splitting", 
                    "Enhanced retrieval strategies",
                    "Context preservation",
                    "Lightweight embeddings"
                ],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Enhanced legal vector service health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "optimized_for": "legal_documents",
                "embedding_engine": "FastEmbed" if self.embedding_model else "Fallback",
                "timestamp": datetime.now().isoformat()
            }

# Global enhanced vector service instance
vector_service = VectorService()
