const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Safe route loading function
function loadRoute(path, fallbackName) {
    try {
        const route = require(path);
        if (typeof route === 'function' || (route && typeof route.use === 'function')) {
            logger.info(`✅ ${fallbackName} routes loaded`);
            return route;
        } else {
            throw new Error(`Invalid router export from ${path}`);
        }
    } catch (error) {
        logger.error(`❌ Failed to load ${fallbackName}: ${error.message}`);
        const fallbackRouter = express.Router();
        fallbackRouter.get('/health', (req, res) => {
            res.json({ status: `${fallbackName} service placeholder`, error: error.message });
        });
        return fallbackRouter;
    }
}

// Load all routes safely
const authRoutes = loadRoute('./api/auth', 'Auth');
const analysisRouter = loadRoute('./api/analysis', 'Analysis');
const docRouter = loadRoute('./api/documents', 'Documents');
const langRouter = loadRoute('./api/languages', 'Languages');
const translatorRouter = loadRoute('./api/translator', 'Translator');

const app = express();

// Middleware setup
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(`${config.API_V1_STR}/auth`, authRoutes);
app.use(`${config.API_V1_STR}/analysis`, analysisRouter);
app.use(`${config.API_V1_STR}/documents`, docRouter);
app.use(`${config.API_V1_STR}/translate`, langRouter);
app.use(`${config.API_V1_STR}/translate`, translatorRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: config.VERSION,
        environment: config.ENVIRONMENT,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    logger.info(`🚀 Legal AI Platform running on port ${PORT}`);
});
