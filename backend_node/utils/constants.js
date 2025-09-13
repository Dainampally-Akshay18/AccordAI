/**
 * Application Constants for Legal AI Platform
 * Centralized configuration and constants used throughout the application
 */

// API Configuration Constants
const API_CONSTANTS = {
    VERSION: "1.0.0",
    API_PREFIX: "/api/v1",
    PROJECT_NAME: "Legal AI Platform",
    
    // Rate limiting
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 1000,
    
    // File upload limits
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FILE_TYPES: ['pdf'],
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

// Authentication Constants
const AUTH_CONSTANTS = {
    JWT_ALGORITHM: "HS256",
    ACCESS_TOKEN_EXPIRE_MINUTES: 60 * 24, // 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: 30,
    
    // Session management
    SESSION_ID_PREFIX: "session_",
    SESSION_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
    
    // Password requirements (for future use)
    MIN_PASSWORD_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBERS: true,
    PASSWORD_REQUIRE_SPECIAL: true
};

// Document Processing Constants
const DOCUMENT_CONSTANTS = {
    // Chunking parameters
    DEFAULT_CHUNK_SIZE: 500,
    DEFAULT_CHUNK_OVERLAP: 100,
    MIN_CHUNK_SIZE: 50,
    MAX_CHUNK_SIZE: 2000,
    
    // Legal document processing
    MIN_CHUNKS_FOR_LEGAL_DOC: 3,
    MAX_CHUNKS_PER_DOCUMENT: 50,
    
    // PDF processing
    MIN_PDF_QUALITY_SCORE: 2.0,
    PREFERRED_PDF_METHODS: ['pdfplumber', 'pymupdf', 'pypdf2'],
    
    // Document types
    DOCUMENT_TYPES: {
        LEGAL_PDF: 'legal_pdf',
        TEXT: 'text',
        EMPLOYMENT_AGREEMENT: 'employment_agreement',
        NDA: 'nda',
        SERVICE_AGREEMENT: 'service_agreement',
        INTERNSHIP_AGREEMENT: 'internship_agreement'
    },
    
    // Supported file formats
    SUPPORTED_FORMATS: ['.pdf', '.txt', '.docx', '.doc'],
    
    // Document ID patterns
    DOCUMENT_ID_PATTERN: /^doc_[a-zA-Z0-9_]+_[a-f0-9]{8}_\d+$/,
    SESSION_DOCUMENT_ID_PATTERN: /^session_[a-f0-9]{32}_\d+_doc_/
};

// Vector Database Constants
const VECTOR_CONSTANTS = {
    // Pinecone configuration
    TARGET_DIMENSION: 384,
    DEFAULT_TOP_K: 10,
    MAX_TOP_K: 50,
    
    // Batch processing
    UPSERT_BATCH_SIZE: 100,
    DELETE_BATCH_SIZE: 1000,
    
    // Search strategies
    LEGAL_SEARCH_MULTIPLIER: 2,
    MIN_SIMILARITY_SCORE: 0.1,
    
    // Indexing
    INDEX_PROPAGATION_DELAY: 5000, // 5 seconds
    
    // Metadata limits
    MAX_METADATA_SIZE: 1000, // characters
    MAX_METADATA_FIELDS: 20
};

// LLM Service Constants
const LLM_CONSTANTS = {
    // Model configuration
    PRIMARY_MODEL: "llama-3.3-70b-versatile",
    FALLBACK_MODEL: "llama-3.1-8b-instant",
    
    // Generation parameters
    DEFAULT_TEMPERATURE: 0.1,
    DEFAULT_MAX_TOKENS: 4000,
    DEFAULT_TOP_P: 0.9,
    
    // Timeouts and retries
    DEFAULT_TIMEOUT: 90000, // 90 seconds
    FALLBACK_TIMEOUT: 45000, // 45 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // Response processing
    MAX_RESPONSE_LENGTH: 10000,
    JSON_EXTRACTION_PATTERN: /\{.*\}/s
};

// Analysis Constants
const ANALYSIS_CONSTANTS = {
    // Analysis types
    ANALYSIS_TYPES: {
        RISK: 'risk',
        NEGOTIATION: 'negotiation',
        SUMMARY: 'summary',
        COMPREHENSIVE: 'comprehensive'
    },
    
    // Risk assessment
    RISK_SEVERITIES: ['Low', 'Medium', 'High'],
    RISK_SCORE_WEIGHTS: {
        High: 3.5,
        Medium: 2.0,
        Low: 1.0
    },
    MIN_RISK_SCORE: 1.0,
    MAX_RISK_SCORE: 10.0,
    
    // Legal search strategies
    SEARCH_STRATEGIES: {
        risk: [
            "liability responsibility indemnification damages penalties liquidated",
            "termination breach default consequences cancellation resignation",
            "payment obligations financial compensation salary stipend bond",
            "compliance regulatory legal requirements obligations mandatory",
            "confidentiality intellectual property proprietary trade secrets",
            "dispute resolution arbitration litigation jurisdiction governing law",
            "service bond penalty premature termination employment agreement"
        ],
        negotiation: [
            "compensation salary payment benefits remuneration stipend CTC",
            "obligations duties responsibilities performance requirements deliverables",
            "termination resignation notice period conditions cancellation",
            "benefits perks allowances reimbursement compensation package",
            "confidentiality non-disclosure proprietary information trade secrets",
            "intellectual property ownership rights inventions work product",
            "location transfer posting assignment relocation flexibility"
        ],
        summary: [
            "agreement contract parties involved relationship employer employee",
            "obligations duties responsibilities requirements performance evaluation",
            "compensation payment financial terms money salary stipend CTC",
            "duration term timeline dates effective period internship employment",
            "termination conditions notice requirements end resignation bond",
            "confidentiality proprietary intellectual property rights inventions",
            "location work assignment posting transfer relocation policy"
        ]
    },
    
    // Content analysis
    LEGAL_TERMS: [
        'agreement', 'contract', 'terms', 'conditions', 'party', 'obligations',
        'liability', 'indemnification', 'confidentiality', 'intellectual property',
        'service bond', 'liquidated damages', 'termination', 'breach',
        'compensation', 'salary', 'stipend', 'benefits', 'employment'
    ]
};

// Translation Constants
const TRANSLATION_CONSTANTS = {
    // Supported languages (subset - full list would be much longer)
    COMMON_LANGUAGES: {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh-CN': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'tr': 'Turkish',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish'
    },
    
    // Translation limits
    MAX_TEXT_LENGTH: 5000,
    MAX_BATCH_SIZE: 100,
    
    // Quality thresholds
    MIN_CONFIDENCE_SCORE: 0.5,
    PREFERRED_CONFIDENCE_SCORE: 0.8
};

// Error Constants
const ERROR_CONSTANTS = {
    // Error types
    TYPES: {
        VALIDATION_ERROR: 'validation_error',
        AUTHENTICATION_ERROR: 'authentication_error',
        AUTHORIZATION_ERROR: 'authorization_error',
        NOT_FOUND: 'not_found',
        SERVER_ERROR: 'server_error',
        RATE_LIMIT_ERROR: 'rate_limit_exceeded',
        FILE_ERROR: 'file_error',
        DATABASE_ERROR: 'database_error',
        EXTERNAL_SERVICE_ERROR: 'external_service_error'
    },
    
    // HTTP Status codes
    STATUS_CODES: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503
    },
    
    // Common error messages
    MESSAGES: {
        VALIDATION_FAILED: 'Validation failed',
        UNAUTHORIZED: 'Authentication required',
        FORBIDDEN: 'Access denied',
        NOT_FOUND: 'Resource not found',
        SERVER_ERROR: 'Internal server error',
        RATE_LIMITED: 'Too many requests, please try again later',
        FILE_TOO_LARGE: 'File size exceeds maximum limit',
        INVALID_FILE_TYPE: 'File type not supported',
        DATABASE_CONNECTION_FAILED: 'Database connection failed',
        EXTERNAL_SERVICE_UNAVAILABLE: 'External service unavailable'
    }
};

// Logging Constants
const LOGGING_CONSTANTS = {
    // Log levels
    LEVELS: {
        ERROR: 'error',
        WARN: 'warn',
        INFO: 'info',
        DEBUG: 'debug'
    },
    
    // Log categories with emojis (matching FastAPI patterns)
    CATEGORIES: {
        LEGAL: '📋',
        SUCCESS: '✅',
        WARNING: '⚠️',
        ERROR: '❌',
        PROCESSING: '🔧',
        VECTOR: '🔍',
        AI: '🤖',
        PERFORMANCE: '⏱️',
        SECURITY: '🔒',
        DATABASE: '🗄️',
        FILE: '📄',
        NETWORK: '🌐'
    },
    
    // Performance thresholds
    SLOW_QUERY_THRESHOLD: 1000, // 1 second
    SLOW_REQUEST_THRESHOLD: 5000, // 5 seconds
    SLOW_ANALYSIS_THRESHOLD: 30000 // 30 seconds
};

// Environment Constants
const ENVIRONMENT_CONSTANTS = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
    STAGING: 'staging'
};

// Health Check Constants
const HEALTH_CONSTANTS = {
    // Service names
    SERVICES: {
        DATABASE: 'database',
        VECTOR_DB: 'vector_database',
        LLM: 'llm_service',
        PDF: 'pdf_service',
        TRANSLATION: 'translation_service',
        REDIS: 'redis'
    },
    
    // Health status
    STATUS: {
        HEALTHY: 'healthy',
        UNHEALTHY: 'unhealthy',
        DEGRADED: 'degraded'
    },
    
    // Check intervals
    CHECK_INTERVAL: 30000, // 30 seconds
    TIMEOUT: 10000 // 10 seconds
};

module.exports = {
    API_CONSTANTS,
    AUTH_CONSTANTS,
    DOCUMENT_CONSTANTS,
    VECTOR_CONSTANTS,
    LLM_CONSTANTS,
    ANALYSIS_CONSTANTS,
    TRANSLATION_CONSTANTS,
    ERROR_CONSTANTS,
    LOGGING_CONSTANTS,
    ENVIRONMENT_CONSTANTS,
    HEALTH_CONSTANTS
};
