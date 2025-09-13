/**
 * Document Model
 * Equivalent to document.py SQLAlchemy model
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
const { query } = require('../connection');

class Document {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.user_id = data.user_id;
        // File information
        this.filename = data.filename;
        this.original_filename = data.original_filename;
        this.file_path = data.file_path;
        this.file_size = data.file_size;
        this.mime_type = data.mime_type;
        this.file_hash = data.file_hash;
        // Document metadata
        this.title = data.title || null;
        this.document_type = data.document_type || null;
        this.language = data.language || "en";
        this.page_count = data.page_count || null;
        // Processing status
        this.processing_status = data.processing_status || "pending";
        this.extracted_text = data.extracted_text || null;
        // Analysis metadata
        this.clause_count = data.clause_count || 0;
        this.risk_score = data.risk_score || null;
        this.confidence_score = data.confidence_score || null;
        // Settings
        this.jurisdiction = data.jurisdiction || "US";
        this.is_archived = data.is_archived !== undefined ? data.is_archived : false;
        // Timestamps
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
        this.processed_at = data.processed_at || null;
    }

    // Static methods for database operations
    static async create(documentData) {
        try {
            const document = new Document(documentData);
            
            const result = await query(
                `INSERT INTO documents (
                    id, user_id, filename, original_filename, file_path, file_size, mime_type, file_hash,
                    title, document_type, language, page_count, processing_status, extracted_text,
                    clause_count, risk_score, confidence_score, jurisdiction, is_archived,
                    created_at, updated_at, processed_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                ) RETURNING *`,
                [
                    document.id, document.user_id, document.filename, document.original_filename,
                    document.file_path, document.file_size, document.mime_type, document.file_hash,
                    document.title, document.document_type, document.language, document.page_count,
                    document.processing_status, document.extracted_text, document.clause_count,
                    document.risk_score, document.confidence_score, document.jurisdiction,
                    document.is_archived, document.created_at, document.updated_at, document.processed_at
                ]
            );
            
            logger.legalSuccess(`Document created: ${document.filename}`);
            return new Document(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to create document: ${error.message}`);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Document(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to find document by ID: ${error.message}`);
            throw error;
        }
    }

    static async findByUserId(userId, limit = 50, offset = 0) {
        try {
            const result = await query(
                'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
                [userId, limit, offset]
            );
            
            return result.rows.map(row => new Document(row));
            
        } catch (error) {
            logger.legalError(`Failed to find documents by user ID: ${error.message}`);
            throw error;
        }
    }

    static async findByHash(fileHash) {
        try {
            const result = await query('SELECT * FROM documents WHERE file_hash = $1', [fileHash]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Document(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to find document by hash: ${error.message}`);
            throw error;
        }
    }

    // Instance methods
    async save() {
        try {
            this.updated_at = new Date();
            
            const result = await query(
                `UPDATE documents SET
                    filename = $2, original_filename = $3, file_path = $4, file_size = $5,
                    mime_type = $6, file_hash = $7, title = $8, document_type = $9,
                    language = $10, page_count = $11, processing_status = $12,
                    extracted_text = $13, clause_count = $14, risk_score = $15,
                    confidence_score = $16, jurisdiction = $17, is_archived = $18,
                    updated_at = $19, processed_at = $20
                WHERE id = $1 RETURNING *`,
                [
                    this.id, this.filename, this.original_filename, this.file_path,
                    this.file_size, this.mime_type, this.file_hash, this.title,
                    this.document_type, this.language, this.page_count, this.processing_status,
                    this.extracted_text, this.clause_count, this.risk_score,
                    this.confidence_score, this.jurisdiction, this.is_archived,
                    this.updated_at, this.processed_at
                ]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Document not found');
            }
            
            logger.legalSuccess(`Document updated: ${this.filename}`);
            return new Document(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to save document: ${error.message}`);
            throw error;
        }
    }

    async delete() {
        try {
            const result = await query('DELETE FROM documents WHERE id = $1', [this.id]);
            
            if (result.rowCount === 0) {
                throw new Error('Document not found');
            }
            
            logger.legalSuccess(`Document deleted: ${this.filename}`);
            return true;
            
        } catch (error) {
            logger.legalError(`Failed to delete document: ${error.message}`);
            throw error;
        }
    }

    async markProcessed() {
        try {
            this.processing_status = "completed";
            this.processed_at = new Date();
            return await this.save();
            
        } catch (error) {
            logger.legalError(`Failed to mark document as processed: ${error.message}`);
            throw error;
        }
    }

    async markFailed(errorMessage = null) {
        try {
            this.processing_status = "failed";
            if (errorMessage) {
                this.extracted_text = errorMessage; // Store error in extracted_text field
            }
            return await this.save();
            
        } catch (error) {
            logger.legalError(`Failed to mark document as failed: ${error.message}`);
            throw error;
        }
    }

    // Utility methods
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            filename: this.filename,
            original_filename: this.original_filename,
            file_path: this.file_path,
            file_size: this.file_size,
            mime_type: this.mime_type,
            file_hash: this.file_hash,
            title: this.title,
            document_type: this.document_type,
            language: this.language,
            page_count: this.page_count,
            processing_status: this.processing_status,
            extracted_text: this.extracted_text,
            clause_count: this.clause_count,
            risk_score: this.risk_score,
            confidence_score: this.confidence_score,
            jurisdiction: this.jurisdiction,
            is_archived: this.is_archived,
            created_at: this.created_at,
            updated_at: this.updated_at,
            processed_at: this.processed_at
        };
    }

    toString() {
        return `<Document(id='${this.id}', filename='${this.filename}')>`;
    }

    // Relationships
    async getUser() {
        try {
            const User = require('./user');
            return await User.findById(this.user_id);
            
        } catch (error) {
            logger.legalError(`Failed to get document user: ${error.message}`);
            throw error;
        }
    }

    async getAnalyses() {
        try {
            const result = await query(
                'SELECT * FROM analyses WHERE document_id = $1 ORDER BY created_at DESC',
                [this.id]
            );
            
            const Analysis = require('./analysis');
            return result.rows.map(row => new Analysis(row));
            
        } catch (error) {
            logger.legalError(`Failed to get document analyses: ${error.message}`);
            throw error;
        }
    }

    // Database table creation
    static async createTable() {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS documents (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    filename VARCHAR(255) NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    mime_type VARCHAR(100) NOT NULL,
                    file_hash VARCHAR(64) NOT NULL,
                    title VARCHAR(500),
                    document_type VARCHAR(100),
                    language VARCHAR(10) DEFAULT 'en',
                    page_count INTEGER,
                    processing_status VARCHAR(50) DEFAULT 'pending',
                    extracted_text TEXT,
                    clause_count INTEGER DEFAULT 0,
                    risk_score INTEGER,
                    confidence_score INTEGER,
                    jurisdiction VARCHAR(50) DEFAULT 'US',
                    is_archived BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
                CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
                CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
                CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
            `);
            
            logger.legalSuccess('Document table created successfully');
            
        } catch (error) {
            logger.legalError(`Failed to create document table: ${error.message}`);
            throw error;
        }
    }
}

module.exports = Document;
