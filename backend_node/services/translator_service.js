const { translate } = require('google-translate-api-x');
const logger = require('../utils/logger');

/**
 * Translate text from source language to target language
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code  
 * @param {string} text - Text to translate
 * @returns {Promise<string>} Translated text or error message
 */
async function translateText(sourceLang, targetLang, text) {
    try {
        logger.info("Translator initialized successfully.");
        
        // Validate inputs
        if (!sourceLang || !targetLang || !text) {
            throw new Error("Missing required parameters: sourceLang, targetLang, or text");
        }

        if (typeof text !== 'string' || text.trim().length === 0) {
            throw new Error("Text must be a non-empty string");
        }

        // Log translation attempt
        logger.info(`Translating text from ${sourceLang} to ${targetLang}`, {
            sourceLang,
            targetLang,
            textLength: text.length,
            textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        });

        // Perform translation using google-translate-api-x
        const result = await translate(text, {
            from: sourceLang,
            to: targetLang
        });

        logger.legalSuccess(`Translation completed successfully`, {
            originalLength: text.length,
            translatedLength: result.text.length,
            detectedLanguage: result.from.language.iso
        });

        return result.text;

    } catch (error) {
        logger.legalError(`Translation failed: ${error.message}`, {
            sourceLang,
            targetLang,
            textLength: text ? text.length : 0,
            error: error.message
        });
        
        // Return error message (matching Python behavior)
        return error.message;
    }
}

/**
 * Batch translate multiple texts
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string[]} texts - Array of texts to translate
 * @returns {Promise<string[]>} Array of translated texts
 */
async function batchTranslateText(sourceLang, targetLang, texts) {
    try {
        if (!Array.isArray(texts)) {
            throw new Error("Texts must be an array");
        }

        logger.info(`Starting batch translation of ${texts.length} texts from ${sourceLang} to ${targetLang}`);

        const translations = await Promise.all(
            texts.map(text => translateText(sourceLang, targetLang, text))
        );

        logger.legalSuccess(`Batch translation completed successfully`, {
            totalTexts: texts.length,
            sourceLang,
            targetLang
        });

        return translations;

    } catch (error) {
        logger.legalError(`Batch translation failed: ${error.message}`);
        return texts.map(() => error.message); // Return error for each text
    }
}

/**
 * Detect language of given text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Language detection result
 */
async function detectLanguage(text) {
    try {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            throw new Error("Text must be a non-empty string");
        }

        // Use translation to English to detect source language
        const result = await translate(text, { to: 'en' });

        return {
            detectedLanguage: result.from.language.iso,
            confidence: result.from.language.didYouMean ? 0.7 : 0.9,
            originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            translatedText: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : '')
        };

    } catch (error) {
        logger.legalError(`Language detection failed: ${error.message}`);
        return {
            error: error.message,
            detectedLanguage: null,
            confidence: 0
        };
    }
}

/**
 * Check if translation service is available
 * @returns {Promise<Object>} Health check result
 */
async function healthCheck() {
    try {
        const testText = "Hello, world!";
        const result = await translateText('en', 'es', testText);
        
        const isHealthy = result && !result.includes('failed') && !result.includes('error');
        
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            service: 'google-translate-api-x',
            testTranslation: result,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            service: 'google-translate-api-x',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    translateText,
    batchTranslateText,
    detectLanguage,
    healthCheck
};
