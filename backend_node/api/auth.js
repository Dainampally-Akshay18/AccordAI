const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config');
const { HTTPException, AuthenticationException, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// JWT Configuration (matching auth.py exactly)
const JWT_SECRET_KEY = config.JWT_SECRET_KEY || "your-super-secret-jwt-key-change-in-production";
const JWT_ALGORITHM = "HS256";
const JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 24 hours

// Request/Response schemas (matching Pydantic models)
class SessionRequest {
    constructor(data) {
        this.client_info = data.client_info || "web_client";
    }
}

class SessionResponse {
    constructor(data) {
        this.access_token = data.access_token;
        this.token_type = data.token_type;
        this.expires_in = data.expires_in;
        this.session_id = data.session_id;
        this.created_at = data.created_at;
    }
}

class TokenValidationResponse {
    constructor(data) {
        this.valid = data.valid;
        this.session_id = data.session_id;
        this.expires_at = data.expires_at;
        this.created_at = data.created_at;
    }
}

// Helper functions (matching auth.py functions exactly)
function createAccessToken(data, expiresIn = null) {
    const payload = { ...data };
    const expiration = expiresIn || JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000; // Convert to milliseconds
    const expire = new Date(Date.now() + expiration);
    
    payload.exp = Math.floor(expire.getTime() / 1000); // JWT expects seconds
    payload.iat = Math.floor(Date.now() / 1000);
    payload.type = "access_token";
    
    const encodedJwt = jwt.sign(payload, JWT_SECRET_KEY, { algorithm: JWT_ALGORITHM });
    return encodedJwt;
}

function verifyToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET_KEY, { algorithms: [JWT_ALGORITHM] });
        return payload;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new HTTPException(401, "Token has expired");
        } else if (error.name === 'JsonWebTokenError') {
            throw new HTTPException(401, "Invalid token");
        }
        throw new HTTPException(401, "Token verification failed");
    }
}

// Middleware to get current session (matching get_current_session dependency)
async function getCurrentSession(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationException("Authorization header missing or invalid");
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = verifyToken(token);
        
        req.currentSession = {
            session_id: payload.session_id,
            created_at: payload.created_at,
            expires_at: payload.exp
        };
        
        next();
    } catch (error) {
        next(error);
    }
}

// Routes (matching exact endpoints from auth.py)

// POST /create-session
router.post('/create-session', asyncHandler(async (req, res) => {
    try {
        const sessionRequest = new SessionRequest(req.body);
        
        // Generate unique session ID (matching auth.py format)
        const sessionId = `session_${uuidv4().replace(/-/g, '')}_${Math.floor(Date.now() / 1000)}`;
        const createdAt = new Date().toISOString();
        
        // Create token payload (matching auth.py structure)
        const tokenData = {
            session_id: sessionId,
            client_info: sessionRequest.client_info,
            created_at: createdAt
        };
        
        // Create JWT token
        const accessToken = createAccessToken(tokenData);
        
        logger.info(`Created new session: ${sessionId}`);
        
        const response = new SessionResponse({
            access_token: accessToken,
            token_type: "bearer",
            expires_in: JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60, // in seconds
            session_id: sessionId,
            created_at: createdAt
        });
        
        res.json(response);
        
    } catch (error) {
        logger.error(`Failed to create session: ${error.message}`);
        throw new HTTPException(500, "Failed to create session");
    }
}));

// POST /validate-token
router.post('/validate-token', getCurrentSession, asyncHandler(async (req, res) => {
    try {
        const session = req.currentSession;
        
        const response = new TokenValidationResponse({
            valid: true,
            session_id: session.session_id,
            expires_at: new Date(session.expires_at * 1000).toISOString(),
            created_at: session.created_at
        });
        
        res.json(response);
        
    } catch (error) {
        logger.error(`Token validation error: ${error.message}`);
        throw error; // Let the middleware handle it
    }
}));

// POST /refresh-token
router.post('/refresh-token', getCurrentSession, asyncHandler(async (req, res) => {
    try {
        const session = req.currentSession;
        
        // Create new token with same session data (matching auth.py logic)
        const tokenData = {
            session_id: session.session_id,
            client_info: "web_client",
            created_at: session.created_at
        };
        
        const newToken = createAccessToken(tokenData);
        
        res.json({
            access_token: newToken,
            token_type: "bearer",
            expires_in: JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            session_id: session.session_id
        });
        
    } catch (error) {
        logger.error(`Token refresh failed: ${error.message}`);
        throw new HTTPException(500, "Token refresh failed");
    }
}));

// GET /session-info
router.get('/session-info', getCurrentSession, asyncHandler(async (req, res) => {
    const session = req.currentSession;
    
    res.json({
        session_id: session.session_id,
        created_at: session.created_at,
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        status: "active",
        token_valid: true
    });
}));

// Export router and middleware (matching authRoutes export)
module.exports = router;
module.exports.getCurrentSession = getCurrentSession;
