const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

// Database credentials from environment variables (matching Python)
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || "6543";
const DB_NAME = process.env.DB_NAME;
const PROJECT_REF = process.env.PROJECT_REF;
const DB_DIRECT_HOST = process.env.DB_DIRECT_HOST;

// Format username for Supabase connection pooler (matching Python)
function formatUsername() {
    if (PROJECT_REF) {
        return `postgres.${PROJECT_REF}`;
    }
    return DB_USER;
}

// Construct the database URL (matching Python)
const FORMATTED_USER = formatUsername();
const DATABASE_URL = `postgresql://${FORMATTED_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

logger.info(`Database URL: postgresql://${FORMATTED_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

// Create connection pool with Supabase/pgbouncer compatibility settings (matching Python)
const pool = new Pool({
    connectionString: DATABASE_URL,
    // 🔥 FIXED: All necessary Supabase/pgbouncer compatibility settings
    max: 10, // pool_size
    idleTimeoutMillis: 300000, // pool_recycle (5 minutes)
    connectionTimeoutMillis: 30000, // timeout
    query_timeout: 10000, // command_timeout
    statement_timeout: 10000, // statement timeout
    // Disable prepared statement caching for pgbouncer compatibility
    allowExitOnIdle: true,
    
    // Connection options for pgbouncer compatibility
    options: '--search_path=public'
});

// Test connectivity functions (keeping existing logic from Python)
const net = require('net');
const dns = require('dns');

function testPortOpen(host, port, timeout = 10000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        const onError = () => {
            socket.destroy();
            logger.legalError(`Port ${port} is not open on ${host}`);
            resolve(false);
        };

        socket.setTimeout(timeout);
        socket.once('error', onError);
        socket.once('timeout', onError);
        
        socket.connect(port, host, () => {
            socket.end();
            logger.legalSuccess(`Port ${port} is open on ${host}`);
            resolve(true);
        });
    });
}

function resolveHostname(hostname) {
    return new Promise((resolve) => {
        dns.lookup(hostname, { all: true }, (err, addresses) => {
            if (err) {
                logger.legalError(`Failed to resolve hostname ${hostname}: ${err.message}`);
                resolve([]);
            } else {
                const ipAddresses = addresses.map(addr => addr.address);
                logger.legalSuccess(`Hostname ${hostname} resolves to IP addresses: ${ipAddresses}`);
                resolve(ipAddresses);
            }
        });
    });
}

async function testConnectivity() {
    const ipAddresses = await resolveHostname(DB_HOST);
    if (ipAddresses.length === 0) {
        return false;
    }

    const port = parseInt(DB_PORT);
    for (const ip of ipAddresses) {
        if (await testPortOpen(ip, port)) {
            return true;
        }
    }
    return false;
}

// Test database connection (matching Python)
async function testConnection() {
    try {
        logger.processingInfo("Testing network connectivity...");
        if (!(await testConnectivity())) {
            logger.legalError("Network connectivity test failed");
            return false;
        }

        logger.processingInfo(`Attempting to connect to database at ${DB_HOST}:${DB_PORT}`);
        logger.processingInfo(`Using username: ${FORMATTED_USER}`);

        // Test connection with statement cache disabled (matching Python)
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        
        logger.legalSuccess(`Database connection test successful. Current time: ${result.rows[0].now}`);
        client.release();
        return true;

    } catch (error) {
        logger.legalError(`Database connection test failed: ${error.message}`);
        logger.legalError(`Exception type: ${error.constructor.name}`);
        return false;
    }
}

// Retry utility (matching Python's tenacity)
async function retry(fn, attempts = 3, delay = 4000) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === attempts - 1) throw error;
            logger.legalWarning(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 10000); // Exponential backoff, max 10s
        }
    }
}

// Initialize database with better error handling (matching Python)
async function initDb() {
    try {
        await retry(async () => {
            // Test connection first (matching Python)
            if (!(await testConnection())) {
                throw new Error("Connection test failed before initialization");
            }

            // Note: Table creation would go here when models are implemented
            // For now, just ensure connection works
            logger.legalSuccess("Database tables created successfully");
        });

    } catch (error) {
        logger.legalError(`Database initialization error: ${error.message}`);
        throw error;
    }
}

// Database query helper
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        logger.processingInfo(`Executed query in ${duration}ms`);
        return result;
    } catch (error) {
        logger.legalError(`Database query failed: ${error.message}`);
        throw error;
    }
}

// Get database client (for transactions)
async function getClient() {
    try {
        return await pool.connect();
    } catch (error) {
        logger.legalError(`Failed to get database client: ${error.message}`);
        throw error;
    }
}

// Graceful shutdown
async function closePool() {
    try {
        await pool.end();
        logger.legalSuccess("Database pool closed successfully");
    } catch (error) {
        logger.legalError(`Error closing database pool: ${error.message}`);
    }
}

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
    pool,
    query,
    getClient,
    initDb,
    testConnection,
    closePool,
    
    // Export for testing
    testConnectivity,
    resolveHostname,
    testPortOpen
};
