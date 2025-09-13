const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { getCurrentSession } = require('./auth');
const vectorService = require('../services/vector_service');
const pdfService = require('../services/pdf_service');
const logger = require('../utils/logger');
const config = require('../config');
const { HTTPException, ValidationException, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for file uploads (matching FastAPI File handling)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: config.MAX_FILE_SIZE, // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Accept only PDF files for now (matching FastAPI logic)
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are supported'), false);
        }
    }
});

// Request/Response schemas (matching Pydantic models)
class StoreChunkRequest {
    constructor(data) {
        this.document_id = data.document_id;
        this.full_text = data.full_text;
        this.chunk_size = data.chunk_size || 500; // Larger chunks for legal documents
        this.overlap = data.overlap || 100;
        this.document_type = data.document_type || "text";
        
        // Validation
        if (!this.full_text || typeof this.full_text !== 'string' || !this.full_text.trim()) {
            throw new ValidationException("Text cannot be empty");
        }
    }
}

class StoreChunkResponse {
    constructor(data) {
        this.document_id = data.document_id;
        this.session_document_id = data.session_document_id;
        this.chunks_stored = data.chunks_stored;
        this.status = data.status;
        this.timestamp = data.timestamp;
        this.session_id = data.session_id;
        this.extraction_info = data.extraction_info;
        this.backend_type = data.backend_type || "Pinecone Enhanced Legal";
    }
}

// POST /upload-pdf (exact match to FastAPI)
router.post('/upload-pdf', getCurrentSession, upload.single('file'), asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            throw new HTTPException(400, "No file provided");
        }
        
        if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
            throw new HTTPException(400, "Only PDF files are supported");
        }
        
        const sessionId = req.currentSession.session_id;
        const pdfContent = req.file.buffer;
        
        logger.processingInfo(`Processing Legal PDF: ${req.file.originalname} (${pdfContent.length} bytes)`);
        
        // Enhanced PDF text extraction (matching FastAPI)
        const extractionResult = await pdfService.extractTextFromPdf(pdfContent);
        
        if (extractionResult.quality_score < 2.0) {
            logger.legalWarning(`Low quality extraction: ${extractionResult.quality_score}`);
            throw new HTTPException(400, 
                `PDF extraction quality too low (${extractionResult.quality_score.toFixed(1)}/10). Please ensure PDF contains readable text.`
            );
        }
        
        // Generate document ID (matching FastAPI logic)
        const fileHash = crypto.createHash('md5').update(pdfContent).digest('hex');
        const cleanFilename = req.file.originalname
            .replace('.pdf', '')
            .replace(/\s+/g, '_')
            .replace(/-/g, '_');
        const documentId = `doc_${cleanFilename}_${fileHash.substring(0, 8)}_${Math.floor(Date.now() / 1000)}`;
        const sessionDocumentId = `${sessionId}_${documentId}`;
        
        logger.legalSuccess(`Extracted ${extractionResult.text.length} characters using ${extractionResult.method_used}`);
        logger.processingInfo(`Quality score: ${extractionResult.quality_score.toFixed(2)}`);
        
        // Legal document optimized chunking (matching FastAPI)
        const chunks = vectorService.chunkLegalDocument(
            extractionResult.text,
            500,
            100
        );
        
        // Prepare enhanced metadata (matching FastAPI)
        const metadata = {
            session_id: sessionId,
            original_document_id: documentId,
            filename: req.file.originalname,
            created_at: new Date().toISOString(),
            chunk_count: chunks.length,
            text_length: extractionResult.text.length,
            extraction_method: extractionResult.method_used,
            extraction_quality: extractionResult.quality_score,
            document_type: "legal_pdf",
            backend: "Pinecone Enhanced Legal"
        };
        
        // Store chunks in enhanced vector database (matching FastAPI)
        const success = await vectorService.storeDocumentChunks(
            sessionDocumentId,
            chunks,
            metadata
        );
        
        if (!success) {
            throw new HTTPException(500, "Failed to store legal document chunks");
        }
        
        logger.legalSuccess(`Successfully processed Legal PDF: ${chunks.length} chunks stored`);
        
        const response = new StoreChunkResponse({
            document_id: documentId,
            session_document_id: sessionDocumentId,
            chunks_stored: chunks.length,
            status: "success",
            timestamp: new Date().toISOString(),
            session_id: sessionId,
            extraction_info: {
                method: extractionResult.method_used,
                quality_score: extractionResult.quality_score,
                page_count: extractionResult.page_count,
                text_length: extractionResult.text.length,
                document_type: "legal_pdf"
            },
            backend_type: "Pinecone Enhanced Legal"
        });
        
        res.json(response);
        
    } catch (error) {
        if (error instanceof HTTPException || error instanceof ValidationException) {
            throw error;
        }
        
        logger.legalError(`PDF processing failed: ${error.message}`);
        throw new HTTPException(500, `PDF processing failed: ${error.message}`);
    }
}));

// POST /store_chunks (exact match to FastAPI)
router.post('/store_chunks', getCurrentSession, asyncHandler(async (req, res) => {
    try {
        const request = new StoreChunkRequest(req.body);
        const sessionId = req.currentSession.session_id;
        
        // Generate document ID if not provided (matching FastAPI)
        if (!request.document_id) {
            const textHash = crypto.createHash('md5').update(request.full_text).digest('hex');
            request.document_id = `doc_${textHash}_${Math.floor(Date.now() / 1000)}`;
        }
        
        // Create session-specific document ID (matching FastAPI)
        const sessionDocumentId = `${sessionId}_${request.document_id}`;
        
        logger.processingInfo(`STORING ENHANCED LEGAL DOCUMENT:`);
        logger.processingInfo(` Session ID: ${sessionId}`);
        logger.processingInfo(` Document ID: ${request.document_id}`);
        logger.processingInfo(` Text length: ${request.full_text.length} characters`);
        
        // Use enhanced legal document chunking (matching FastAPI)
        const chunks = vectorService.chunkLegalDocument(
            request.full_text,
            request.chunk_size,
            request.overlap
        );
        
        logger.legalSuccess(`Created ${chunks.length} legal document chunks`);
        
        // Prepare enhanced metadata (matching FastAPI)
        const metadata = {
            session_id: sessionId,
            original_document_id: request.document_id,
            created_at: new Date().toISOString(),
            chunk_count: chunks.length,
            text_length: request.full_text.length,
            chunk_size_used: request.chunk_size,
            overlap_used: request.overlap,
            document_type: request.document_type,
            backend: "Pinecone Enhanced Legal"
        };
        
        // Store chunks in enhanced vector database (matching FastAPI)
        const success = await vectorService.storeDocumentChunks(
            sessionDocumentId,
            chunks,
            metadata
        );
        
        if (!success) {
            throw new HTTPException(500, "Failed to store enhanced legal document chunks");
        }
        
        logger.legalSuccess(`Successfully stored enhanced legal document: ${chunks.length} chunks`);
        
        const response = new StoreChunkResponse({
            document_id: request.document_id,
            session_document_id: sessionDocumentId,
            chunks_stored: chunks.length,
            status: "success",
            timestamp: new Date().toISOString(),
            session_id: sessionId,
            extraction_info: {
                method: "direct_text_input",
                quality_score: 10.0,
                text_length: request.full_text.length,
                document_type: request.document_type
            },
            backend_type: "Pinecone Enhanced Legal"
        });
        
        res.json(response);
        
    } catch (error) {
        if (error instanceof HTTPException || error instanceof ValidationException) {
            throw error;
        }
        
        logger.legalError(`Enhanced legal document storage failed: ${error.message}`);
        throw new HTTPException(500, `Failed to store document: ${error.message}`);
    }
}));

// GET /document/:document_id/info (exact match to FastAPI)
router.get('/document/:document_id/info', getCurrentSession, asyncHandler(async (req, res) => {
    try {
        const { document_id } = req.params;
        const sessionId = req.currentSession.session_id;
        const sessionDocumentId = `${sessionId}_${document_id}`;
        
        // Get document info from enhanced vector service (matching FastAPI)
        const docInfo = await vectorService.getDocumentInfo(sessionDocumentId);
        
        res.json({
            document_id: document_id,
            session_document_id: sessionDocumentId,
            session_id: sessionId,
            exists: docInfo.exists || false,
            chunk_count: docInfo.chunk_count || 0,
            created_at: docInfo.created_at,
            status: docInfo.exists ? "stored" : "not_found",
            backend: "Pinecone Enhanced Legal",
            index_total_vectors: docInfo.index_total_vectors || 0,
            optimized_for: "legal_documents",
            optimal_chunks: (docInfo.chunk_count || 0) >= 3,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.legalError(`Failed to get enhanced legal document info: ${error.message}`);
        throw new HTTPException(404, "Legal document not found");
    }
}));

// GET /debug/list-documents (exact match to FastAPI)
router.get('/debug/list-documents', getCurrentSession, asyncHandler(async (req, res) => {
    try {
        const sessionId = req.currentSession.session_id;
        
        // Get enhanced index info (matching FastAPI)
        const indexInfo = vectorService.checkIndexInfo();
        
        // Get health check info (matching FastAPI)
        const healthInfo = await vectorService.healthCheck();
        
        res.json({
            session_id: sessionId,
            backend: "Pinecone Enhanced Legal",
            index_info: indexInfo,
            health_check: healthInfo,
            message: "Enhanced Pinecone with legal document optimization active",
            enhancements: [
                "Legal document aware chunking",
                "Section-based text splitting",
                "Enhanced PDF extraction with quality scoring",
                "Multi-method PDF processing with fallbacks",
                "Improved context preservation for legal analysis",
                "Llama 3.3 70B model integration"
            ],
            supported_formats: [".pdf", ".txt", ".docx", ".doc"],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.legalError(`Failed to list enhanced legal documents: ${error.message}`);
        throw new HTTPException(500, `Failed to list documents: ${error.message}`);
    }
}));

// DELETE /document/:document_id (exact match to FastAPI)
router.delete('/document/:document_id', getCurrentSession, asyncHandler(async (req, res) => {
    try {
        const { document_id } = req.params;
        const sessionId = req.currentSession.session_id;
        const sessionDocumentId = `${sessionId}_${document_id}`;
        
        const success = await vectorService.deleteDocument(sessionDocumentId);
        
        if (!success) {
            throw new HTTPException(500, "Failed to delete enhanced legal document");
        }
        
        logger.legalSuccess(`Successfully deleted enhanced legal document ${document_id} (session ${sessionId})`);
        
        res.json({
            document_id: document_id,
            session_id: sessionId,
            backend: "Pinecone Enhanced Legal",
            status: "deleted",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        
        logger.legalError(`Failed to delete enhanced legal document: ${error.message}`);
        throw new HTTPException(500, "Failed to delete document");
    }
}));

// GET /health/legal-system (exact match to FastAPI)
router.get('/health/legal-system', asyncHandler(async (req, res) => {
    try {
        // Check vector service (matching FastAPI)
        const vectorHealth = await vectorService.healthCheck();
        
        // Check index info (matching FastAPI)
        const indexInfo = vectorService.checkIndexInfo();
        
        // Check PDF service (matching FastAPI)
        const pdfHealth = await pdfService.healthCheck();
        
        res.json({
            system: "Enhanced Legal Document Analysis",
            backend: "Pinecone Enhanced Legal",
            model: "Llama 3.3 70B Versatile",
            vector_service: vectorHealth,
            index_stats: indexInfo,
            pdf_service: pdfHealth,
            features: [
                "Enhanced PDF text extraction",
                "Legal document optimized chunking",
                "Section-aware text splitting",
                "Professional legal analysis",
                "Multi-strategy retrieval",
                "Quality scoring and validation"
            ],
            status: "fully_operational",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.legalError(`Legal system health check failed: ${error.message}`);
        throw new HTTPException(500, `System health check failed: ${error.message}`);
    }
}));

module.exports = router;
