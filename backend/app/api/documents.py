from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import hashlib
from datetime import datetime
import logging
from app.services.vector_service import vector_service

router = APIRouter()
logger = logging.getLogger(__name__)

class StoreChunkRequest(BaseModel):
    document_id: str
    full_text: str
    chunk_size: int = 800
    overlap: int = 100

class StoreChunkResponse(BaseModel):
    document_id: str
    chunks_stored: int
    status: str
    timestamp: str

@router.post("/store_chunks", response_model=StoreChunkResponse)
async def store_document_chunks(request: StoreChunkRequest):
    """
    Store document chunks in vector database for later retrieval
    """
    try:
        if not request.full_text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Generate document ID if not provided
        if not request.document_id:
            text_hash = hashlib.md5(request.full_text.encode()).hexdigest()
            request.document_id = f"doc_{text_hash}_{int(datetime.now().timestamp())}"
        
        # Chunk the document
        chunks = vector_service.chunk_text(
            request.full_text, 
            chunk_size=request.chunk_size,
            overlap=request.overlap
        )
        
        # Store chunks in vector database
        success = await vector_service.store_document_chunks(request.document_id, chunks)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store document chunks")
        
        logger.info(f"Successfully stored {len(chunks)} chunks for document {request.document_id}")
        
        return StoreChunkResponse(
            document_id=request.document_id,
            chunks_stored=len(chunks),
            status="success",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to store chunks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store chunks: {str(e)}")

@router.get("/document/{document_id}/info")
async def get_document_info(document_id: str):
    """Get information about stored document"""
    try:
        # Query Pinecone for document chunks
        stats = vector_service.index.describe_index_stats()
        
        return {
            "document_id": document_id,
            "status": "stored",
            "total_vectors": stats.total_vector_count,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Document not found")

doc_router = router