# vector_service.py - Enhanced with Comprehensive Debugging
import os
import numpy as np
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
import logging
from sentence_transformers import SentenceTransformer
import hashlib
from datetime import datetime
from app.config import settings
import time

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        # Use settings from config.py
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.index = self.pc.Index(self.index_name)
        
        # Use a model that works with your index dimensions
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.target_dimension = 384  # Match your actual Pinecone index dimension
        
        logger.info(f"Initialized VectorService with index: {self.index_name}, dimension: {self.target_dimension}")

    def chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 100) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            chunk_text = ' '.join(chunk_words)
            
            # Create unique ID for this chunk
            chunk_id = hashlib.md5(f"{chunk_text[:100]}{i}".encode()).hexdigest()
            
            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "chunk_index": i // (chunk_size - overlap),
                "word_count": len(chunk_words),
                "start_word": i,
                "end_word": min(i + chunk_size, len(words))
            })
            
            if i + chunk_size >= len(words):
                break
        
        logger.info(f"Created {len(chunks)} chunks from text of {len(words)} words")
        return chunks

    def create_embeddings(self, texts: List[str]) -> np.ndarray:
        """Create embeddings with exact dimension matching"""
        try:
            # Generate embeddings
            embeddings = self.embedding_model.encode(texts)
            
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
            
            logger.info(f"Generated embeddings shape: {embeddings.shape} for {len(chunks)} chunks")
            logger.info(f"🔧 STORING DOCUMENT: {document_id}")
            
            for i, chunk in enumerate(chunks):
                # Prepare metadata (Pinecone has metadata size limits)
                chunk_metadata = {
                    "document_id": document_id,  # ✅ CRITICAL: This is the key for retrieval
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"][:1000],  # Limit to 1000 chars for metadata
                    "word_count": chunk["word_count"],
                    "start_word": chunk.get("start_word", 0),
                    "end_word": chunk.get("end_word", 0),
                    "created_at": datetime.now().isoformat()
                }
                
                # Add additional metadata if provided
                if metadata:
                    for key, value in metadata.items():
                        if key not in chunk_metadata:  # Don't override existing keys
                            chunk_metadata[key] = str(value)[:500]  # Limit metadata values
                
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
                
                # ✅ ENHANCED LOGGING: Log each vector being stored
                logger.info(f"📦 Preparing vector {i+1}/{len(chunks)}: {vector_id}")
                logger.debug(f"   Metadata: document_id='{document_id}', chunk_index={chunk['chunk_index']}")
            
            # Upsert in batches to avoid rate limits
            batch_size = 100
            total_batches = (len(vectors_to_upsert) + batch_size - 1) // batch_size
            
            for batch_idx in range(0, len(vectors_to_upsert), batch_size):
                batch = vectors_to_upsert[batch_idx:batch_idx + batch_size]
                current_batch = (batch_idx // batch_size) + 1
                
                logger.info(f"⬆️ Upserting batch {current_batch}/{total_batches} ({len(batch)} vectors)")
                
                upsert_response = self.index.upsert(
                    vectors=batch,
                    namespace=""  # ✅ EXPLICIT: Use empty string namespace consistently
                )
                
                logger.info(f"✅ Batch {current_batch} upserted successfully: {upsert_response}")
            
            # ✅ CRITICAL: Wait for index to propagate
            logger.info("⏳ Waiting 3 seconds for index propagation...")
            time.sleep(3)
            
            # ✅ VERIFICATION: Immediately verify the stored data
            await self._verify_stored_document(document_id, len(chunks))
            
            logger.info(f"🎉 Successfully stored {len(chunks)} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store chunks: {str(e)}")
            return False

    async def _verify_stored_document(self, document_id: str, expected_chunks: int):
        """Verify that document was actually stored in Pinecone"""
        try:
            logger.info(f"🔍 Verifying stored document: {document_id}")
            
            # Try to find the document immediately after storage
            verification_response = self.index.query(
                vector=[0.0] * self.target_dimension,  # Dummy vector
                filter={"document_id": {"$eq": document_id}},
                top_k=expected_chunks + 5,  # Get all chunks plus some buffer
                include_metadata=True,
                namespace=""
            )
            
            found_chunks = len(verification_response.matches)
            logger.info(f"✅ Verification: Found {found_chunks}/{expected_chunks} chunks for document {document_id}")
            
            if found_chunks == 0:
                logger.error(f"❌ CRITICAL: No chunks found immediately after storage for document {document_id}")
                # Log some sample vector IDs for debugging
                logger.error(f"Expected to find vectors with document_id metadata = '{document_id}'")
            elif found_chunks < expected_chunks:
                logger.warning(f"⚠️ Only {found_chunks}/{expected_chunks} chunks found - possible indexing delay")
            else:
                logger.info(f"🎉 All chunks verified successfully for document {document_id}")
                
        except Exception as e:
            logger.error(f"❌ Verification failed: {str(e)}")

    async def retrieve_relevant_chunks(self, query: str, document_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for a query with enhanced debugging"""
        try:
            if not query.strip():
                logger.warning("Empty query provided")
                return []
            
            # Create query embedding
            query_embedding = self.create_embeddings([query])[0]
            
            # Verify query embedding dimension
            if len(query_embedding) != self.target_dimension:
                raise ValueError(f"Query embedding dimension {len(query_embedding)} doesn't match target {self.target_dimension}")
            
            logger.info(f"🔍 SEARCHING FOR CHUNKS:")
            logger.info(f"   Query: '{query[:50]}...'")
            logger.info(f"   Document ID: '{document_id}'")
            logger.info(f"   Top K: {top_k}")
            logger.info(f"   Namespace: '' (empty string)")
            
            # ✅ ENHANCED: Try multiple search strategies
            search_results = await self._search_with_fallback(query_embedding, document_id, top_k)
            
            logger.info(f"📊 Pinecone returned {len(search_results.matches)} matches")
            
            if len(search_results.matches) == 0:
                # ✅ DEBUGGING: Try to understand why no matches
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
                    "end_word": match.metadata.get("end_word", 0)
                }
                relevant_chunks.append(chunk_data)
                logger.debug(f"   Match: {match.id}, Score: {match.score:.4f}, Chunk: {chunk_data['chunk_index']}")
            
            # Sort by chunk index to maintain document flow
            relevant_chunks.sort(key=lambda x: x["chunk_index"])
            
            logger.info(f"✅ Retrieved {len(relevant_chunks)} relevant chunks")
            return relevant_chunks
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve chunks: {str(e)}")
            return []

    async def _search_with_fallback(self, query_embedding, document_id: str, top_k: int):
        """Try multiple search strategies if first one fails"""
        
        # Strategy 1: Exact filter match
        try:
            logger.info("🎯 Strategy 1: Exact document_id filter")
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                filter={"document_id": {"$eq": document_id}},
                top_k=top_k,
                include_metadata=True,
                include_values=False,
                namespace=""
            )
            if search_results.matches:
                logger.info(f"✅ Strategy 1 succeeded: {len(search_results.matches)} matches")
                return search_results
        except Exception as e:
            logger.warning(f"⚠️ Strategy 1 failed: {str(e)}")
        
        # Strategy 2: Try without filter to see if any vectors exist
        try:
            logger.info("🎯 Strategy 2: Search without filter")
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                top_k=top_k,
                include_metadata=True,
                include_values=False,
                namespace=""
            )
            logger.info(f"📊 Strategy 2: Found {len(search_results.matches)} total vectors in index")
            
            # Filter manually for our document
            filtered_matches = []
            for match in search_results.matches:
                if match.metadata and match.metadata.get("document_id") == document_id:
                    filtered_matches.append(match)
            
            if filtered_matches:
                logger.info(f"✅ Strategy 2: Found {len(filtered_matches)} matches for our document")
                search_results.matches = filtered_matches
                return search_results
            
        except Exception as e:
            logger.warning(f"⚠️ Strategy 2 failed: {str(e)}")
        
        # Return empty results
        from types import SimpleNamespace
        return SimpleNamespace(matches=[])

    async def _debug_no_matches(self, document_id: str, query_embedding, top_k: int):
        """Debug why no matches were found"""
        logger.error(f"🐛 DEBUGGING NO MATCHES for document_id: {document_id}")
        
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
                
                # Check for similar document IDs
                similar_docs = []
                for match in total_vectors.matches:
                    if match.metadata and "document_id" in match.metadata:
                        stored_doc_id = match.metadata["document_id"]
                        if document_id in stored_doc_id or stored_doc_id in document_id:
                            similar_docs.append(stored_doc_id)
                
                if similar_docs:
                    logger.error(f"🔍 Found similar document IDs: {set(similar_docs)}")
                    logger.error(f"🔍 Searching for: '{document_id}'")
            else:
                logger.error("❌ NO VECTORS FOUND IN INDEX AT ALL!")
                
        except Exception as debug_error:
            logger.error(f"❌ Debug failed: {str(debug_error)}")

    async def get_document_info(self, document_id: str) -> Dict[str, Any]:
        """Get information about a stored document with enhanced debugging"""
        try:
            logger.info(f"📋 Getting document info for: {document_id}")
            
            # Try to find any vectors that match the document_id pattern
            search_response = self.index.query(
                vector=[0.0] * self.target_dimension,  # Dummy vector with correct dimension
                filter={"document_id": {"$eq": document_id}},
                top_k=50,  # Get more chunks to count them accurately
                include_metadata=True,
                namespace=""
            )
            
            if not search_response.matches:
                logger.warning(f"⚠️ No matches found for document_id: {document_id}")
                
                # Try to find ANY vectors to see what's in the index
                any_vectors = self.index.query(
                    vector=[0.0] * self.target_dimension,
                    top_k=5,
                    include_metadata=True,
                    namespace=""
                )
                
                if any_vectors.matches:
                    logger.info("🔍 Sample document IDs in index:")
                    for match in any_vectors.matches:
                        if match.metadata and "document_id" in match.metadata:
                            logger.info(f"   Found: '{match.metadata['document_id']}'")
                
                return {
                    "document_id": document_id,
                    "exists": False,
                    "chunk_count": 0
                }
            
            # Get total index stats
            index_stats = self.index.describe_index_stats()
            
            logger.info(f"✅ Found {len(search_response.matches)} chunks for document {document_id}")
            
            return {
                "document_id": document_id,
                "exists": True,
                "chunk_count": len(search_response.matches),
                "index_total_vectors": index_stats.total_vector_count,
                "index_dimension": self.target_dimension,
                "created_at": search_response.matches[0].metadata.get("created_at")
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get document info: {str(e)}")
            return {
                "document_id": document_id,
                "exists": False,
                "error": str(e)
            }

    async def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document"""
        try:
            # First, get all vector IDs for this document
            search_response = self.index.query(
                vector=[0.0] * self.target_dimension,  # Dummy vector with correct dimension
                filter={"document_id": {"$eq": document_id}},
                top_k=10000,  # Get all chunks
                include_metadata=False,
                namespace=""
            )
            
            if not search_response.matches:
                logger.warning(f"No chunks found for document {document_id}")
                return True
            
            # Extract vector IDs
            vector_ids = [match.id for match in search_response.matches]
            
            # Delete vectors in batches
            batch_size = 1000
            for i in range(0, len(vector_ids), batch_size):
                batch_ids = vector_ids[i:i + batch_size]
                self.index.delete(ids=batch_ids, namespace="")
                logger.info(f"Deleted batch of {len(batch_ids)} vectors")
            
            logger.info(f"Successfully deleted {len(vector_ids)} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document: {str(e)}")
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
                "target_dimension": self.target_dimension
            }
            
        except Exception as e:
            logger.error(f"Failed to check index info: {str(e)}")
            return {
                "error": str(e),
                "index_name": self.index_name,
                "target_dimension": self.target_dimension
            }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on vector service"""
        try:
            # Test basic index operations
            test_embedding = self.create_embeddings(["health check test"])
            
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
                "embedding_model_loaded": True,
                "target_dimension": self.target_dimension,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Vector service health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Global vector service instance
vector_service = VectorService()
