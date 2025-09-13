const crypto = require('crypto');
const logger = require('./logger');

/**
 * Utility functions for the Legal AI Platform
 */

// Date and time utilities
class DateUtils {
    static getCurrentTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    static formatISODate(date = new Date()) {
        return date.toISOString();
    }

    static addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    static isExpired(timestamp) {
        return Date.now() > timestamp * 1000;
    }
}

// Text processing utilities
class TextUtils {
    static truncate(text, maxLength = 100, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    static extractFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    static generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    static wordCount(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    static cleanWhitespace(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
}

// Hash and ID generation utilities
class HashUtils {
    static generateHash(data, algorithm = 'md5') {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }

    static generateId(prefix = '') {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
    }

    static generateSessionId() {
        const uuid = crypto.randomUUID().replace(/-/g, '');
        const timestamp = Math.floor(Date.now() / 1000);
        return `session_${uuid}_${timestamp}`;
    }

    static generateDocumentId(filename, content) {
        const fileHash = this.generateHash(content, 'md5');
        const cleanName = TextUtils.sanitizeFilename(filename.replace(/\.[^/.]+$/, ""));
        const timestamp = Math.floor(Date.now() / 1000);
        return `doc_${cleanName}_${fileHash.substring(0, 8)}_${timestamp}`;
    }
}

// Validation utilities
class ValidationUtils {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    static isValidDocumentId(docId) {
        // Matches the pattern: doc_filename_hash_timestamp
        const docIdRegex = /^doc_[a-zA-Z0-9_]+_[a-f0-9]{8}_\d+$/;
        return docIdRegex.test(docId);
    }

    static isValidSessionId(sessionId) {
        // Matches the pattern: session_uuid_timestamp
        const sessionIdRegex = /^session_[a-f0-9]{32}_\d+$/;
        return sessionIdRegex.test(sessionId);
    }

    static sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') return '';
        return input
            .trim()
            .substring(0, maxLength)
            .replace(/[<>]/g, '') // Basic XSS prevention
            .replace(/\0/g, ''); // Remove null bytes
    }
}

// File utilities
class FileUtils {
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static getMimeType(filename) {
        const ext = TextUtils.extractFileExtension(filename);
        const mimeTypes = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    static isValidFileType(filename, allowedTypes = ['pdf']) {
        const ext = TextUtils.extractFileExtension(filename);
        return allowedTypes.includes(ext);
    }
}

// Error handling utilities
class ErrorUtils {
    static createError(message, statusCode = 500, type = 'server_error', details = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.status = statusCode;
        error.type = type;
        if (details) error.details = details;
        return error;
    }

    static isHttpError(error) {
        return error && (error.statusCode || error.status) && typeof error.message === 'string';
    }

    static getErrorDetails(error) {
        return {
            message: error.message || 'Unknown error',
            type: error.type || 'server_error',
            statusCode: error.statusCode || error.status || 500,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        };
    }
}

// Performance utilities
class PerformanceUtils {
    static measureTime(startTime) {
        return Date.now() - startTime;
    }

    static async measureAsync(fn, label = 'Operation') {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = this.measureTime(start);
            logger.logPerformance(label, start);
            return result;
        } catch (error) {
            const duration = this.measureTime(start);
            logger.legalError(`${label} failed after ${duration}ms: ${error.message}`);
            throw error;
        }
    }

    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Legal document specific utilities
class LegalUtils {
    static extractContractType(text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('internship') || textLower.includes('intern') || textLower.includes('ppo')) {
            return 'Internship with Pre-Placement Offer Agreement';
        } else if (textLower.includes('employment') || textLower.includes('job') || textLower.includes('employee')) {
            return 'Employment Agreement';
        } else if (textLower.includes('service') || textLower.includes('consultant') || textLower.includes('freelance')) {
            return 'Service Agreement';
        } else if (textLower.includes('nda') || textLower.includes('confidential') || textLower.includes('disclosure')) {
            return 'Non-Disclosure Agreement';
        } else {
            return 'Legal Employment Agreement';
        }
    }

    static calculateRiskScore(risks) {
        if (!Array.isArray(risks) || risks.length === 0) return 0;
        
        const severityWeights = { High: 3.5, Medium: 2.0, Low: 1.0 };
        const totalWeight = risks.reduce((sum, risk) => {
            return sum + (severityWeights[risk.severity] || 0);
        }, 0);
        
        return Math.min(10.0, Math.max(1.0, totalWeight));
    }

    static identifyLegalTerms(text) {
        const legalTerms = [
            'agreement', 'contract', 'terms', 'conditions', 'party', 'obligations',
            'liability', 'indemnification', 'confidentiality', 'intellectual property',
            'service bond', 'liquidated damages', 'termination', 'breach',
            'compensation', 'salary', 'stipend', 'benefits'
        ];
        
        const foundTerms = [];
        const textLower = text.toLowerCase();
        
        for (const term of legalTerms) {
            if (textLower.includes(term.toLowerCase())) {
                foundTerms.push(term);
            }
        }
        
        return foundTerms;
    }
}

// Memory and caching utilities
class CacheUtils {
    static cache = new Map();
    
    static set(key, value, ttlMs = 300000) { // 5 minutes default TTL
        const expiry = Date.now() + ttlMs;
        this.cache.set(key, { value, expiry });
    }
    
    static get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    static delete(key) {
        return this.cache.delete(key);
    }
    
    static clear() {
        this.cache.clear();
    }
    
    static size() {
        return this.cache.size;
    }
}

module.exports = {
    DateUtils,
    TextUtils,
    HashUtils,
    ValidationUtils,
    FileUtils,
    ErrorUtils,
    PerformanceUtils,
    LegalUtils,
    CacheUtils
};
