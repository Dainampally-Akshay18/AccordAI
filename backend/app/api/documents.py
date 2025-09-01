# documents.py - Add debugging endpoint
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
import hashlib
from datetime import datetime
import logging
from app.services.vector_service import vector_service
from app.api.auth import get_current_session

router = APIRouter()
logger = logging.getLogger(__name__)

class StoreChunkRequest(BaseModel):
    document_id: str
    full_text: str
    chunk_size: int = 800
    overlap: int = 100

class StoreChunkResponse(BaseModel):
    document_id: str
    session_document_id: str
    chunks_stored: int
    status: str
    timestamp: str
    session_id: str

@router.post("/store_chunks", response_model=StoreChunkResponse)
async def store_document_chunks(
    request: StoreChunkRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    Store document chunks in vector database for later retrieval
    Uses JWT session for document isolation
    """
    try:
        if not request.full_text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        session_id = current_session["session_id"]
        
        # Generate document ID if not provided
        if not request.document_id:
            text_hash = hashlib.md5(request.full_text.encode()).hexdigest()
            request.document_id = f"doc_{text_hash}_{int(datetime.now().timestamp())}"

        # Create session-specific document ID for isolation
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"📄 STORING DOCUMENT:")
        logger.info(f"   Session ID: {session_id}")
        logger.info(f"   Original Document ID: {request.document_id}")
        logger.info(f"   Session Document ID: {session_document_id}")
        logger.info(f"   Text length: {len(request.full_text)} characters")

        # Chunk the document
        chunks = vector_service.chunk_text(
            request.full_text,
            chunk_size=request.chunk_size,
            overlap=request.overlap
        )

        logger.info(f"   Created {len(chunks)} chunks")

        # Prepare metadata for chunks
        metadata = {
            "session_id": session_id,
            "original_document_id": request.document_id,
            "created_at": datetime.now().isoformat(),
            "chunk_count": len(chunks)
        }

        # Store chunks in vector database with session isolation
        success = await vector_service.store_document_chunks(
            document_id=session_document_id,
            chunks=chunks,
            metadata=metadata
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to store document chunks")

        logger.info(f"✅ Successfully stored {len(chunks)} chunks for document {request.document_id} (session {session_id})")

        return StoreChunkResponse(
            document_id=request.document_id,
            session_document_id=session_document_id,
            chunks_stored=len(chunks),
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to store chunks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store chunks: {str(e)}")

@router.get("/document/{document_id}/info")
async def get_document_info(
    document_id: str,
    current_session: dict = Depends(get_current_session)
):
    """Get information about stored document for current session"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{document_id}"
        
        # Get document info from vector service
        doc_info = await vector_service.get_document_info(session_document_id)
        
        return {
            "document_id": document_id,
            "session_document_id": session_document_id,
            "session_id": session_id,
            "exists": doc_info.get("exists", False),
            "chunk_count": doc_info.get("chunk_count", 0),
            "created_at": doc_info.get("created_at"),
            "status": "stored" if doc_info.get("exists") else "not_found",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Failed to get document info: {str(e)}")
        raise HTTPException(status_code=404, detail="Document not found")

# ✅ ADDED: Debug endpoint to list all documents for session
@router.get("/debug/list-documents")
async def list_session_documents(current_session: dict = Depends(get_current_session)):
    """Debug endpoint to list all documents for current session"""
    try:
        session_id = current_session["session_id"]
        
        # Get index stats to see what's in there
        index_info = vector_service.check_index_info()
        
        return {
            "session_id": session_id,
            "index_info": index_info,
            "message": "Check server logs for detailed vector information",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to list documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@router.delete("/document/{document_id}")
async def delete_document(
    document_id: str,
    current_session: dict = Depends(get_current_session)
):
    """Delete a document and all its chunks for current session"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{document_id}"
        
        success = await vector_service.delete_document(session_document_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete document")
        
        logger.info(f"✅ Successfully deleted document {document_id} for session {session_id}")
        
        return {
            "document_id": document_id,
            "session_id": session_id,
            "status": "deleted",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete document")

doc_router = router
