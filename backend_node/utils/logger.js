const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for better readability (matching FastAPI logging format)
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let logMessage = `${timestamp} - ${level.toUpperCase()}: ${message}`;
        
        // Add stack trace for errors
        if (stack) {
            logMessage += `\n${stack}`;
        }
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        return logMessage;
    })
);

// Create logger instance (matching FastAPI's logging configuration)
const logger = winston.createLogger({
    level: config.DEBUG ? 'debug' : 'info',
    format: customFormat,
    defaultMeta: { 
        service: 'legal-ai-platform',
        environment: config.ENVIRONMENT,
        version: config.VERSION
    },
    transports: [
        // Console transport with colors for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                customFormat
            ),
            silent: process.env.NODE_ENV === 'test' // Silence logs during testing
        })
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
    rejectionHandlers: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Add file transports for production (matching FastAPI's production logging)
if (config.ENVIRONMENT === 'production') {
    // Error log file
    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));

    // Combined log file
    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));

    // Also add file-based exception handlers for production
    logger.exceptions.handle(
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );

    logger.rejections.handle(
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880, // 5MB  
            maxFiles: 5
        })
    );
}

// Add custom log levels and methods to match FastAPI usage patterns
logger.setLevel = (level) => {
    logger.level = level;
    logger.transports.forEach(transport => {
        transport.level = level;
    });
};

// Helper methods matching Python logger usage patterns
logger.logWithEmoji = (level, emoji, message, meta = {}) => {
    logger[level](`${emoji} ${message}`, meta);
};

// Specific methods for legal document processing (matching your FastAPI patterns)
logger.legalInfo = (message, meta = {}) => {
    logger.logWithEmoji('info', '📋', message, meta);
};

logger.legalSuccess = (message, meta = {}) => {
    logger.logWithEmoji('info', '✅', message, meta);
};

logger.legalWarning = (message, meta = {}) => {
    logger.logWithEmoji('warn', '⚠️', message, meta);
};

logger.legalError = (message, meta = {}) => {
    logger.logWithEmoji('error', '❌', message, meta);
};

logger.vectorInfo = (message, meta = {}) => {
    logger.logWithEmoji('info', '🔍', message, meta);
};

logger.processingInfo = (message, meta = {}) => {
    logger.logWithEmoji('info', '🔧', message, meta);
};

logger.aiInfo = (message, meta = {}) => {
    logger.logWithEmoji('info', '🤖', message, meta);
};

// Performance logging
logger.logPerformance = (operation, startTime, meta = {}) => {
    const duration = Date.now() - startTime;
    logger.info(`⏱️  ${operation} completed in ${duration}ms`, { 
        operation, 
        duration,
        ...meta 
    });
};

// Request logging (for middleware)
logger.logRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    if (res.statusCode >= 400) {
        logger.warn(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
    } else {
        logger.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
    }
};

module.exports = logger;
