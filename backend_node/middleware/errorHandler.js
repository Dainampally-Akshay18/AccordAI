const logger = require('../utils/logger');

// Error handler middleware (matching FastAPI's global_exception_handler)
const errorHandler = (error, req, res, next) => {
    // Log the error with full context (matching FastAPI's logger.error)
    logger.error(`Global exception: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
    });

    // Default error response
    let statusCode = error.status || error.statusCode || 500;
    let errorResponse = {
        detail: error.message || 'Internal server error',
        type: 'server_error'
    };

    // Handle specific error types (matching FastAPI's HTTPException patterns)
    
    // JWT/Authentication errors
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorResponse = {
            detail: 'Invalid token',
            type: 'authentication_error'
        };
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        errorResponse = {
            detail: 'Token has expired',
            type: 'token_expired'
        };
    } 
    
    // Validation errors (matching Pydantic validation errors)
    else if (error.name === 'ValidationError') {
        statusCode = 422;
        errorResponse = {
            detail: 'Validation error',
            type: 'validation_error',
            errors: error.details || error.message
        };
    }
    
    // File upload errors
    else if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        errorResponse = {
            detail: 'File too large',
            type: 'file_size_exceeded'
        };
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        errorResponse = {
            detail: 'Unexpected file upload',
            type: 'invalid_file_upload'
        };
    }
    
    // Database errors
    else if (error.name === 'SequelizeConnectionError') {
        statusCode = 503;
        errorResponse = {
            detail: 'Database connection failed',
            type: 'database_error'
        };
    } else if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        errorResponse = {
            detail: 'Database validation error',
            type: 'validation_error',
            errors: error.errors?.map(e => e.message) || []
        };
    }
    
    // Rate limiting errors  
    else if (error.name === 'RateLimitError') {
        statusCode = 429;
        errorResponse = {
            detail: 'Too many requests',
            type: 'rate_limit_exceeded'
        };
    }
    
    // Custom application errors
    else if (error.type) {
        errorResponse.type = error.type;
    }

    // Don't expose internal errors in production (matching FastAPI behavior)
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        errorResponse.detail = 'Internal server error';
        // Remove stack trace and sensitive info
        delete errorResponse.stack;
    } else if (process.env.NODE_ENV !== 'production') {
        // Include stack trace in development
        errorResponse.stack = error.stack;
    }

    // Send error response (matching FastAPI's JSONResponse format)
    res.status(statusCode).json(errorResponse);
};

// Not found handler
const notFoundHandler = (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    
    res.status(404).json({
        detail: 'Not found',
        type: 'not_found'
    });
};

// Async error wrapper (utility for handling async route errors)
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Custom error classes (matching FastAPI's HTTPException)
class HTTPException extends Error {
    constructor(statusCode, detail, type = 'http_exception') {
        super(detail);
        this.name = 'HTTPException';
        this.status = statusCode;
        this.statusCode = statusCode;
        this.type = type;
    }
}

class ValidationException extends Error {
    constructor(detail, errors = []) {
        super(detail);
        this.name = 'ValidationError';
        this.status = 422;
        this.statusCode = 422;
        this.type = 'validation_error';
        this.errors = errors;
    }
}

class AuthenticationException extends Error {
    constructor(detail = 'Authentication required') {
        super(detail);
        this.name = 'AuthenticationError';
        this.status = 401;
        this.statusCode = 401;
        this.type = 'authentication_error';
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    HTTPException,
    ValidationException,
    AuthenticationException
};
