import os
import numpy as np
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
import logging
from sentence_transformers import SentenceTransformer
import hashlib
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        # Use settings from config.py
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.index: Index = self.pc.Index(self.index_name)
        
        # Use a model that works with your index dimensions
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.target_dimension = 1024  # Your Pinecone index dimension
        
        logger.info(f"Initialized VectorService with index: {self.index_name}")
        
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
        """Create embeddings and pad to match index dimension"""
        try:
            # Generate embeddings
            embeddings = self.embedding_model.encode(texts)
            
            # Handle single embedding case
            if len(embeddings.shape) == 1:
                embeddings = embeddings.reshape(1, -1)
            
            # Get current dimensions
            current_dim = embeddings.shape[1]
            
            logger.debug(f"Generated embeddings with dimension: {current_dim}, target: {self.target_dimension}")
            
            # Pad to target dimension if needed
            if current_dim < self.target_dimension:
                padding = np.zeros((embeddings.shape[0], self.target_dimension - current_dim))
                embeddings = np.hstack([embeddings, padding])
                logger.debug(f"Padded embeddings to {self.target_dimension} dimensions")
            
            # Truncate if too large
            elif current_dim > self.target_dimension:
                embeddings = embeddings[:, :self.target_dimension]
                logger.debug(f"Truncated embeddings to {self.target_dimension} dimensions")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to create embeddings: {str(e)}")
            raise
    
    async def store_document_chunks(self, document_id: str, chunks: List[Dict[str, Any]]) -> bool:
        """Store document chunks in Pinecone"""
        try:
            if not chunks:
                logger.warning("No chunks provided for storage")
                return False
            
            vectors_to_upsert = []
            
            # Process chunks in batches for embedding generation
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.create_embeddings(chunk_texts)
            
            for i, chunk in enumerate(chunks):
                # Prepare metadata (Pinecone has metadata size limits)
                metadata = {
                    "document_id": document_id,
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"][:1000],  # Limit to 1000 chars for metadata
                    "word_count": chunk["word_count"],
                    "start_word": chunk.get("start_word", 0),
                    "end_word": chunk.get("end_word", 0),
                    "created_at": datetime.now().isoformat()
                }
                
                vectors_to_upsert.append({
                    "id": f"{document_id}_{chunk['id']}",
                    "values": embeddings[i].tolist(),
                    "metadata": metadata
                })
            
            # Upsert in batches to avoid rate limits
            batch_size = 100
            total_batches = (len(vectors_to_upsert) + batch_size - 1) // batch_size
            
            for batch_idx in range(0, len(vectors_to_upsert), batch_size):
                batch = vectors_to_upsert[batch_idx:batch_idx + batch_size]
                current_batch = (batch_idx // batch_size) + 1
                
                logger.info(f"Upserting batch {current_batch}/{total_batches} ({len(batch)} vectors)")
                
                upsert_response = self.index.upsert(
                    vectors=batch,
                    namespace=""  # Use default namespace
                )
                
                logger.debug(f"Batch {current_batch} upsert response: {upsert_response}")
                
            logger.info(f"Successfully stored {len(chunks)} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store chunks: {str(e)}")
            return False
    
    async def retrieve_relevant_chunks(self, query: str, document_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for a query"""
        try:
            if not query.strip():
                logger.warning("Empty query provided")
                return []
            
            # Create query embedding
            query_embedding = self.create_embeddings([query])[0]
            
            logger.info(f"Searching for relevant chunks: query='{query[:50]}...', document_id={document_id}, top_k={top_k}")
            
            # Search in Pinecone with document filter
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                filter={"document_id": {"$eq": document_id}},
                top_k=top_k,
                include_metadata=True,
                include_values=False,
                namespace=""  # Use default namespace
            )
            
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
            
            # Sort by chunk index to maintain document flow
            relevant_chunks.sort(key=lambda x: x["chunk_index"])
            
            logger.info(f"Retrieved {len(relevant_chunks)} relevant chunks")
            return relevant_chunks
            
        except Exception as e:
            logger.error(f"Failed to retrieve chunks: {str(e)}")
            return []
    
    async def get_document_info(self, document_id: str) -> Dict[str, Any]:
        """Get information about a stored document"""
        try:
            # Query for document chunks count
            stats_response = self.index.query(
                vector=[0.0] * self.target_dimension,  # Dummy vector
                filter={"document_id": {"$eq": document_id}},
                top_k=1,
                include_metadata=True,
                namespace=""
            )
            
            if not stats_response.matches:
                return {
                    "document_id": document_id,
                    "exists": False,
                    "chunk_count": 0
                }
            
            # Get total index stats
            index_stats = self.index.describe_index_stats()
            
            return {
                "document_id": document_id,
                "exists": True,
                "chunk_count": len(stats_response.matches),
                "index_total_vectors": index_stats.total_vector_count,
                "index_dimension": self.target_dimension,
                "created_at": stats_response.matches[0].metadata.get("created_at")
            }
            
        except Exception as e:
            logger.error(f"Failed to get document info: {str(e)}")
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
                vector=[0.0] * self.target_dimension,  # Dummy vector
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
