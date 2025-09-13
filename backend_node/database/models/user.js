/**
 * User Model
 * Equivalent to user.py SQLAlchemy model
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const { query } = require('../connection');

class User {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.email = data.email;
        this.display_name = data.display_name || null;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.email_verified = data.email_verified !== undefined ? data.email_verified : false;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
        this.last_login = data.last_login || null;
    }

    // Static methods for database operations
    static async create(userData) {
        try {
            const user = new User(userData);
            
            const result = await query(
                `INSERT INTO users (id, email, display_name, is_active, email_verified, created_at, updated_at, last_login)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [user.id, user.email, user.display_name, user.is_active, user.email_verified, 
                 user.created_at, user.updated_at, user.last_login]
            );
            
            logger.legalSuccess(`User created: ${user.email}`);
            return new User(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to create user: ${error.message}`);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const result = await query('SELECT * FROM users WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to find user by ID: ${error.message}`);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const result = await query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to find user by email: ${error.message}`);
            throw error;
        }
    }

    static async findAll(limit = 50, offset = 0) {
        try {
            const result = await query(
                'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
                [limit, offset]
            );
            
            return result.rows.map(row => new User(row));
            
        } catch (error) {
            logger.legalError(`Failed to find users: ${error.message}`);
            throw error;
        }
    }

    // Instance methods
    async save() {
        try {
            this.updated_at = new Date();
            
            const result = await query(
                `UPDATE users 
                 SET email = $2, display_name = $3, is_active = $4, email_verified = $5, 
                     updated_at = $6, last_login = $7
                 WHERE id = $1
                 RETURNING *`,
                [this.id, this.email, this.display_name, this.is_active, 
                 this.email_verified, this.updated_at, this.last_login]
            );
            
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }
            
            logger.legalSuccess(`User updated: ${this.email}`);
            return new User(result.rows[0]);
            
        } catch (error) {
            logger.legalError(`Failed to save user: ${error.message}`);
            throw error;
        }
    }

    async delete() {
        try {
            const result = await query('DELETE FROM users WHERE id = $1', [this.id]);
            
            if (result.rowCount === 0) {
                throw new Error('User not found');
            }
            
            logger.legalSuccess(`User deleted: ${this.email}`);
            return true;
            
        } catch (error) {
            logger.legalError(`Failed to delete user: ${error.message}`);
            throw error;
        }
    }

    async updateLastLogin() {
        try {
            this.last_login = new Date();
            await this.save();
            
        } catch (error) {
            logger.legalError(`Failed to update last login: ${error.message}`);
            throw error;
        }
    }

    // Utility methods
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            display_name: this.display_name,
            is_active: this.is_active,
            email_verified: this.email_verified,
            created_at: this.created_at,
            updated_at: this.updated_at,
            last_login: this.last_login
        };
    }

    toString() {
        return `<User(id='${this.id}', email='${this.email}')>`;
    }

    // Relationships (async methods to get related data)
    async getDocuments() {
        try {
            const result = await query(
                'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
                [this.id]
            );
            
            const Document = require('./document');
            return result.rows.map(row => new Document(row));
            
        } catch (error) {
            logger.legalError(`Failed to get user documents: ${error.message}`);
            throw error;
        }
    }

    async getAnalyses() {
        try {
            const result = await query(
                'SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC',
                [this.id]
            );
            
            const Analysis = require('./analysis');
            return result.rows.map(row => new Analysis(row));
            
        } catch (error) {
            logger.legalError(`Failed to get user analyses: ${error.message}`);
            throw error;
        }
    }

    async getAuditLogs() {
        try {
            const result = await query(
                'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC',
                [this.id]
            );
            
            const Audit = require('./audit');
            return result.rows.map(row => new Audit(row));
            
        } catch (error) {
            logger.legalError(`Failed to get user audit logs: ${error.message}`);
            throw error;
        }
    }

    // Database table creation
    static async createTable() {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    display_name VARCHAR(255),
                    is_active BOOLEAN DEFAULT true,
                    email_verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
            `);
            
            logger.legalSuccess('User table created successfully');
            
        } catch (error) {
            logger.legalError(`Failed to create user table: ${error.message}`);
            throw error;
        }
    }
}

module.exports = User;
