const express = require('express');
const { translateText } = require('../services/translator_service');
const logger = require('../utils/logger');
const { HTTPException, ValidationException, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Request schema (matching Pydantic TranslationRequest)
class TranslationRequest {
    constructor(data) {
        this.source_lang = data.source_lang;
        this.target_lang = data.target_lang;
        this.text = data.text;
        
        // Validation
        if (!this.source_lang || !this.target_lang || !this.text) {
            throw new ValidationException("Missing required fields: source_lang, target_lang, text");
        }
        
        if (typeof this.text !== 'string' || this.text.trim().length === 0) {
            throw new ValidationException("Text must be a non-empty string");
        }
    }
}

// POST /translate (exact match to translator.py)
router.post('/translate', asyncHandler(async (req, res) => {
    try {
        // Validate request data
        const translationRequest = new TranslationRequest(req.body);
        
        logger.info(`Translation request: ${translationRequest.source_lang} -> ${translationRequest.target_lang}`, {
            source_lang: translationRequest.source_lang,
            target_lang: translationRequest.target_lang,
            text_length: translationRequest.text.length,
            text_preview: translationRequest.text.substring(0, 50) + (translationRequest.text.length > 50 ? '...' : '')
        });
        
        // Perform translation using service
        const result = await translateText(
            translationRequest.source_lang,
            translationRequest.target_lang,
            translationRequest.text
        );
        
        // Check if result is an error message
        if (typeof result === 'string' && (result.includes('error') || result.includes('failed'))) {
            logger.legalError(`Translation service error: ${result}`);
            throw new HTTPException(500, `Translation failed: ${result}`);
        }
        
        logger.legalSuccess('Translation completed successfully', {
            source_lang: translationRequest.source_lang,
            target_lang: translationRequest.target_lang,
            original_length: translationRequest.text.length,
            translated_length: result.length
        });
        
        // Return result (matching FastAPI format)
        res.json({
            success: true,
            source_language: translationRequest.source_lang,
            target_language: translationRequest.target_lang,
            original_text: translationRequest.text,
            translated_text: result,
            character_count: {
                original: translationRequest.text.length,
                translated: result.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        if (error instanceof ValidationException) {
            throw error;
        }
        
        logger.legalError(`Translation endpoint error: ${error.message}`);
        throw new HTTPException(500, `Translation service error: ${error.message}`);
    }
}));

// POST /translate/batch (batch translation endpoint)
router.post('/translate/batch', asyncHandler(async (req, res) => {
    try {
        const { source_lang, target_lang, texts } = req.body;
        
        // Validation
        if (!source_lang || !target_lang || !texts) {
            throw new ValidationException("Missing required fields: source_lang, target_lang, texts");
        }
        
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new ValidationException("texts must be a non-empty array");
        }
        
        if (texts.length > 100) {
            throw new ValidationException("Maximum 100 texts allowed per batch");
        }
        
        logger.info(`Batch translation request: ${source_lang} -> ${target_lang}`, {
            source_lang,
            target_lang,
            text_count: texts.length,
            total_characters: texts.reduce((sum, text) => sum + (text?.length || 0), 0)
        });
        
        // Translate each text
        const translations = [];
        const errors = [];
        
        for (let i = 0; i < texts.length; i++) {
            try {
                const text = texts[i];
                if (!text || typeof text !== 'string') {
                    errors.push({ index: i, error: "Invalid text at index " + i });
                    translations.push(null);
                    continue;
                }
                
                const result = await translateText(source_lang, target_lang, text);
                translations.push(result);
                
            } catch (error) {
                errors.push({ index: i, error: error.message });
                translations.push(null);
            }
        }
        
        logger.legalSuccess(`Batch translation completed`, {
            source_lang,
            target_lang,
            successful: translations.filter(t => t !== null).length,
            failed: errors.length,
            total: texts.length
        });
        
        res.json({
            success: true,
            source_language: source_lang,
            target_language: target_lang,
            translations: translations,
            errors: errors,
            statistics: {
                total: texts.length,
                successful: translations.filter(t => t !== null).length,
                failed: errors.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        if (error instanceof ValidationException) {
            throw error;
        }
        
        logger.legalError(`Batch translation error: ${error.message}`);
        throw new HTTPException(500, `Batch translation failed: ${error.message}`);
    }
}));

module.exports = router;
