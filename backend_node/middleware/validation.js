/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

const Joi = require('joi');
const { ValidationException } = require('./errorHandler');
const logger = require('../utils/logger');

// Common validation schemas
const commonSchemas = {
    uuid: Joi.string().uuid({ version: 'uuidv4' }),
    email: Joi.string().email().max(255),
    text: Joi.string().max(10000),
    documentId: Joi.string().pattern(/^doc_[a-zA-Z0-9_]+_[a-f0-9]{8}_\d+$/),
    sessionId: Joi.string().pattern(/^session_[a-f0-9]{32}_\d+$/),
    jurisdiction: Joi.string().valid('US', 'EU', 'UK', 'CA', 'AU', 'IN').default('US'),
    language: Joi.string().length(2).lowercase(),
    chunkSize: Joi.number().integer().min(50).max(2000).default(500),
    overlap: Joi.number().integer().min(0).max(500).default(100)
};

// Authentication schemas
const authSchemas = {
    sessionRequest: Joi.object({
        client_info: Joi.string().max(100).default('web_client')
    }),
    
    refreshTokenRequest: Joi.object({
        // No body required - gets session from middleware
    })
};

// Document schemas
const documentSchemas = {
    storeChunks: Joi.object({
        document_id: commonSchemas.documentId.optional(),
        full_text: Joi.string().min(10).max(100000).required(),
        chunk_size: commonSchemas.chunkSize,
        overlap: commonSchemas.overlap,
        document_type: Joi.string().valid('text', 'legal_pdf', 'employment_agreement', 'nda', 'service_agreement').default('text')
    }),
    
    documentInfo: Joi.object({
        document_id: commonSchemas.documentId.required()
    })
};

// Analysis schemas
const analysisSchemas = {
    analysisRequest: Joi.object({
        document_id: commonSchemas.documentId.required(),
        jurisdiction: commonSchemas.jurisdiction
    })
};

// Translation schemas
const translationSchemas = {
    translateRequest: Joi.object({
        source_lang: commonSchemas.language.required(),
        target_lang: commonSchemas.language.required(),
        text: Joi.string().min(1).max(5000).required()
    }),
    
    batchTranslateRequest: Joi.object({
        source_lang: commonSchemas.language.required(),
        target_lang: commonSchemas.language.required(),
        texts: Joi.array().items(Joi.string().min(1).max(5000)).min(1).max(100).required()
    })
};

// File upload validation
const fileSchemas = {
    pdfUpload: {
        fileFilter: (req, file, cb) => {
            // Validate file type
            if (file.mimetype !== 'application/pdf') {
                return cb(new ValidationException('Only PDF files are allowed'));
            }
            
            // Validate file size (handled by multer, but double-check)
            if (file.size && file.size > 10 * 1024 * 1024) { // 10MB
                return cb(new ValidationException('File size too large (max 10MB)'));
            }
            
            cb(null, true);
        }
    }
};

// Validation middleware factory
function validateSchema(schema, source = 'body') {
    return (req, res, next) => {
        try {
            let dataToValidate;
            
            switch (source) {
                case 'body':
                    dataToValidate = req.body;
                    break;
                case 'query':
                    dataToValidate = req.query;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                default:
                    dataToValidate = req.body;
            }
            
            const { error, value } = schema.validate(dataToValidate, {
                allowUnknown: false,
                stripUnknown: true,
                abortEarly: false
            });
            
            if (error) {
                const errorDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));
                
                logger.legalWarning(`Validation failed for ${req.method} ${req.path}`, {
                    errors: errorDetails,
                    source
                });
                
                throw new ValidationException('Validation failed', errorDetails);
            }
            
            // Replace the source data with validated/sanitized data
            switch (source) {
                case 'body':
                    req.body = value;
                    break;
                case 'query':
                    req.query = value;
                    break;
                case 'params':
                    req.params = value;
                    break;
            }
            
            next();
            
        } catch (error) {
            next(error);
        }
    };
}

// Validation middleware for file uploads
function validateFileUpload(requirements = {}) {
    return (req, res, next) => {
        try {
            // Check if file exists
            if (requirements.required && !req.file) {
                throw new ValidationException('File is required');
            }
            
            if (req.file) {
                // Validate file size
                if (requirements.maxSize && req.file.size > requirements.maxSize) {
                    throw new ValidationException(`File size too large (max ${Math.round(requirements.maxSize / 1024 / 1024)}MB)`);
                }
                
                // Validate file type
                if (requirements.allowedTypes && !requirements.allowedTypes.includes(req.file.mimetype)) {
                    throw new ValidationException(`File type not allowed. Allowed types: ${requirements.allowedTypes.join(', ')}`);
                }
                
                // Validate file extension
                if (requirements.allowedExtensions) {
                    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
                    if (!requirements.allowedExtensions.includes(fileExtension)) {
                        throw new ValidationException(`File extension not allowed. Allowed extensions: ${requirements.allowedExtensions.join(', ')}`);
                    }
                }
            }
            
            next();
            
        } catch (error) {
            next(error);
        }
    };
}

// Input sanitization middleware
function sanitizeInput() {
    return (req, res, next) => {
        try {
            // Sanitize string inputs to prevent XSS
            function sanitizeObject(obj) {
                if (typeof obj === 'string') {
                    return obj
                        .replace(/[<>]/g, '') // Remove potential HTML tags
                        .replace(/\0/g, '') // Remove null bytes
                        .trim();
                } else if (Array.isArray(obj)) {
                    return obj.map(sanitizeObject);
                } else if (obj !== null && typeof obj === 'object') {
                    const sanitized = {};
                    for (const [key, value] of Object.entries(obj)) {
                        sanitized[key] = sanitizeObject(value);
                    }
                    return sanitized;
                }
                return obj;
            }
            
            if (req.body) {
                req.body = sanitizeObject(req.body);
            }
            
            if (req.query) {
                req.query = sanitizeObject(req.query);
            }
            
            next();
            
        } catch (error) {
            logger.legalError(`Input sanitization failed: ${error.message}`);
            next(error);
        }
    };
}

// Rate limiting validation
function validateRateLimit() {
    return (req, res, next) => {
        // Additional rate limiting logic can be added here
        // For now, just pass through (rate limiting is handled in server.js)
        next();
    };
}

// Export validation middleware and schemas
module.exports = {
    // Middleware functions
    validateSchema,
    validateFileUpload,
    sanitizeInput,
    validateRateLimit,
    
    // Schemas organized by feature
    auth: authSchemas,
    documents: documentSchemas,
    analysis: analysisSchemas,
    translation: translationSchemas,
    files: fileSchemas,
    common: commonSchemas,
    
    // Pre-configured middleware for common use cases
    middleware: {
        // Authentication
        validateSessionRequest: validateSchema(authSchemas.sessionRequest),
        
        // Documents
        validateStoreChunks: validateSchema(documentSchemas.storeChunks),
        validateDocumentInfo: validateSchema(documentSchemas.documentInfo, 'params'),
        validatePdfUpload: validateFileUpload({
            required: true,
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['application/pdf'],
            allowedExtensions: ['pdf']
        }),
        
        // Analysis
        validateAnalysisRequest: validateSchema(analysisSchemas.analysisRequest),
        
        // Translation
        validateTranslateRequest: validateSchema(translationSchemas.translateRequest),
        validateBatchTranslateRequest: validateSchema(translationSchemas.batchTranslateRequest),
        
        // General
        sanitizeAllInputs: sanitizeInput()
    }
};
