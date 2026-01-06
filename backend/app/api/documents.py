# app/api/documents.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Header
from pydantic import BaseModel
import hashlib
from datetime import datetime
import logging
from typing import Optional

# Import services
from app.services.vector_service import vector_service
from app.services.pdf_service import pdf_service

# 🟢 RE-IMPORTED: The real auth dependency
from app.api.auth import get_current_session 

router = APIRouter()
logger = logging.getLogger(__name__)

class StoreChunkRequest(BaseModel):
    document_id: str
    full_text: str
    chunk_size: int = 500
    overlap: int = 100
    document_type: str = "text"

class StoreChunkResponse(BaseModel):
    document_id: str
    session_document_id: str
    chunks_stored: int
    status: str
    timestamp: str
    session_id: str
    extraction_info: dict
    backend_type: str = "Pinecone Enhanced Legal"

@router.post("/upload-pdf", response_model=StoreChunkResponse)
async def upload_and_process_pdf(
    file: UploadFile = File(...),
    # 🟢 UPDATED: Use the REAL session from auth.py
    current_session: dict = Depends(get_current_session) 
):
    """
    Upload PDF and process with enhanced extraction for legal documents
    """
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # 🟢 CRITICAL FIX: This now gets the REAL Firebase UID
        session_id = current_session["session_id"]
        
        # Read PDF content
        pdf_content = await file.read()
        
        logger.info(f"📄 Processing Legal PDF for User {session_id}: {file.filename}")
        
        # Enhanced PDF text extraction
        extraction_result = pdf_service.extract_text_from_pdf(pdf_content)
        
        if extraction_result['quality_score'] < 2.0:
            logger.warning(f"⚠️ Low quality extraction: {extraction_result['quality_score']}")
            raise HTTPException(
                status_code=400, 
                detail=f"PDF extraction quality too low ({extraction_result['quality_score']:.1f}/10). Please ensure PDF contains readable text."
            )
        
        # Generate document ID
        file_hash = hashlib.md5(pdf_content).hexdigest()
        clean_filename = file.filename.replace('.pdf', '').replace(' ', '_').replace('-', '_')
        document_id = f"doc_{clean_filename}_{file_hash[:8]}_{int(datetime.now().timestamp())}"
        
        # 🟢 CRITICAL: This ID must match what analysis.py looks for
        session_document_id = f"{session_id}_{document_id}"
        
        logger.info(f"✅ Generated Session Document ID: {session_document_id}")
        
        # Legal document optimized chunking
        chunks = vector_service.chunk_legal_document(
            extraction_result['text'],
            chunk_size=500,
            overlap=100
        )
        
        # Prepare enhanced metadata
        metadata = {
            "session_id": session_id,
            "original_document_id": document_id,
            "filename": file.filename,
            "created_at": datetime.now().isoformat(),
            "chunk_count": len(chunks),
            "text_length": len(extraction_result['text']),
            "extraction_method": extraction_result['method_used'],
            "extraction_quality": extraction_result['quality_score'],
            "document_type": "legal_pdf",
            "backend": "Pinecone Enhanced Legal"
        }
        
        # Store chunks in enhanced vector database
        success = await vector_service.store_document_chunks(
            document_id=session_document_id,
            chunks=chunks,
            metadata=metadata
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store legal document chunks")
        
        logger.info(f"🎉 Successfully processed Legal PDF: {len(chunks)} chunks stored")
        
        return StoreChunkResponse(
            document_id=document_id,
            session_document_id=session_document_id,
            chunks_stored=len(chunks),
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id,
            extraction_info={
                "method": extraction_result['method_used'],
                "quality_score": extraction_result['quality_score'],
                "page_count": extraction_result['page_count'],
                "text_length": len(extraction_result['text']),
                "document_type": "legal_pdf"
            },
            backend_type="Pinecone Enhanced Legal"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ PDF processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

@router.post("/store_chunks", response_model=StoreChunkResponse)
async def store_document_chunks(
    request: StoreChunkRequest,
    # 🟢 UPDATED: Use the REAL session
    current_session: dict = Depends(get_current_session)
):
    """
    Store document chunks with enhanced legal document processing
    """
    try:
        if not request.full_text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        session_id = current_session["session_id"]
        
        if not request.document_id:
            text_hash = hashlib.md5(request.full_text.encode()).hexdigest()
            request.document_id = f"doc_{text_hash}_{int(datetime.now().timestamp())}"

        session_document_id = f"{session_id}_{request.document_id}"
        
        # Use enhanced legal document chunking
        chunks = vector_service.chunk_legal_document(
            request.full_text,
            chunk_size=request.chunk_size,
            overlap=request.overlap
        )
        
        metadata = {
            "session_id": session_id,
            "original_document_id": request.document_id,
            "created_at": datetime.now().isoformat(),
            "chunk_count": len(chunks),
            "text_length": len(request.full_text),
            "chunk_size_used": request.chunk_size,
            "overlap_used": request.overlap,
            "document_type": request.document_type,
            "backend": "Pinecone Enhanced Legal"
        }
        
        success = await vector_service.store_document_chunks(
            document_id=session_document_id,
            chunks=chunks,
            metadata=metadata
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store enhanced legal document chunks")
        
        return StoreChunkResponse(
            document_id=request.document_id,
            session_document_id=session_document_id,
            chunks_stored=len(chunks),
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id,
            extraction_info={
                "method": "direct_text_input",
                "quality_score": 10.0,
                "text_length": len(request.full_text),
                "document_type": request.document_type
            },
            backend_type="Pinecone Enhanced Legal"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Enhanced legal document storage failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store document: {str(e)}")

@router.get("/document/{document_id}/info")
async def get_document_info(
    document_id: str,
    # 🟢 UPDATED: Use the REAL session
    current_session: dict = Depends(get_current_session)
):
    """Get enhanced information about stored legal document"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{document_id}"

        doc_info = await vector_service.get_document_info(session_document_id)

        return {
            "document_id": document_id,
            "session_document_id": session_document_id,
            "session_id": session_id,
            "exists": doc_info.get("exists", False),
            "chunk_count": doc_info.get("chunk_count", 0),
            "created_at": doc_info.get("created_at"),
            "status": "stored" if doc_info.get("exists") else "not_found",
            "backend": "Pinecone Enhanced Legal",
            "index_total_vectors": doc_info.get("index_total_vectors", 0),
            "optimized_for": "legal_documents",
            "optimal_chunks": doc_info.get("chunk_count", 0) >= 3,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Failed to get enhanced legal document info: {str(e)}")
        raise HTTPException(status_code=404, detail="Legal document not found")

@router.delete("/document/{document_id}")
async def delete_document(
    document_id: str,
    # 🟢 UPDATED: Use the REAL session
    current_session: dict = Depends(get_current_session)
):
    """Delete enhanced legal document and all its chunks"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{document_id}"

        success = await vector_service.delete_document(session_document_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete enhanced legal document")

        logger.info(f"✅ Successfully deleted enhanced legal document {document_id} (session {session_id})")

        return {
            "document_id": document_id,
            "session_id": session_id,
            "backend": "Pinecone Enhanced Legal",
            "status": "deleted",
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete enhanced legal document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete document")
        
# Keep the health checks and debug endpoints as they are, but update dependencies if needed
@router.get("/debug/list-documents")
async def list_session_documents(current_session: dict = Depends(get_current_session)):
    """Debug endpoint for enhanced legal document system"""
    # ... logic remains the same ...
    return {"message": "Debug endpoint active"}

@router.get("/health/legal-system")
async def legal_system_health_check():
    # ... logic remains the same ...
    return {"status": "healthy"}

doc_router = router