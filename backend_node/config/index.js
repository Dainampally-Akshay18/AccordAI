require('dotenv').config();

class Settings {
    constructor() {
        // API Configuration (exact match to FastAPI config.py)
        this.SECRET_KEY = process.env.SECRET_KEY || "your-super-secret-jwt-key-change-this-in-production";
        this.ALGORITHM = "HS256";
        this.ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES) || 30;
        this.API_V1_STR = "/api/v1";
        this.PROJECT_NAME = "Legal AI Platform";
        this.VERSION = "1.0.0";

        // Environment
        this.ENVIRONMENT = process.env.ENVIRONMENT || "development";
        this.DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';

        // Database Components (commented out like in original FastAPI)
        // this.DB_USER = process.env.DB_USER || "postgres";
        // this.DB_PASSWORD = process.env.DB_PASSWORD;
        // this.DB_HOST = process.env.DB_HOST;
        // this.DB_PORT = parseInt(process.env.DB_PORT) || 5432;
        // this.DB_NAME = process.env.DB_NAME || "postgres";
        // this.DATABASE_URL_RAW = process.env.DATABASE_URL || null;

        // Firebase (commented out like in original)
        // this.FIREBASE_CREDENTIALS_PATH = process.env.FIREBASE_CREDENTIALS_PATH || null;
        // this.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

        // AI Services
        this.GROQ_API_KEY = process.env.GROQ_API_KEY;
        this.PINECONE_API_KEY = process.env.PINECONE_API_KEY;
        this.PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
        this.PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "legal-clauses";

        // Redis
        this.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

        // File Storage
        this.SUPABASE_URL = process.env.SUPABASE_URL;
        this.SUPABASE_KEY = process.env.SUPABASE_KEY;
        this.MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

        // Security (matching FastAPI exactly)
        this.JWT_SECRET_KEY = process.env.SECRET_KEY;
        this.JWT_ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES) || 30;

        // CORS
        this.ALLOWED_ORIGINS = this._parseAllowedOrigins();

        // Validate on construction
        if (this.ENVIRONMENT === 'production') {
            this.validate();
        }
    }

    // DATABASE_URL property (matching Python @property decorator behavior)
    get DATABASE_URL() {
        // Construct database URL with properly encoded credentials
        if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST) {
            const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD);
            return `postgresql://${process.env.DB_USER}:${encodedPassword}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;
        } else if (process.env.DATABASE_URL) {
            return process.env.DATABASE_URL;
        } else {
            throw new Error("Database configuration is incomplete");
        }
    }

    _parseAllowedOrigins() {
        if (process.env.ALLOWED_ORIGINS) {
            return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
        }
        return ["http://localhost:3000", "https://your-frontend.netlify.app"];
    }

    // Validation method
    validate() {
        const required = ['GROQ_API_KEY', 'PINECONE_API_KEY', 'PINECONE_ENVIRONMENT'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Additional validation
        if (!this.SECRET_KEY || this.SECRET_KEY === "your-super-secret-jwt-key-change-this-in-production") {
            console.warn('⚠️  Warning: Using default SECRET_KEY in production is not secure!');
        }
    }

    // Config class equivalent (matching Python's inner Config class)
    static get Config() {
        return {
            env_file: ".env",
            case_sensitive: true,
            extra: "allow" // Changed to "allow" to accept extra fields
        };
    }
}

// Create settings instance (matching Python's: settings = Settings())
const settings = new Settings();

module.exports = settings;
