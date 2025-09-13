const express = require('express');
const { translate } = require('google-translate-api-x');
const logger = require('../utils/logger');
const { HTTPException, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Supported languages mapping (Google Translate supported languages)
const SUPPORTED_LANGUAGES = {
    'af': 'Afrikaans',
    'sq': 'Albanian', 
    'ar': 'Arabic',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bn': 'Bengali',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'ceb': 'Cebuano',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'co': 'Corsican',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'tl': 'Filipino',
    'fi': 'Finnish',
    'fr': 'French',
    'fy': 'Frisian',
    'gl': 'Galician',
    'ka': 'Georgian',
    'de': 'German',
    'el': 'Greek',
    'gu': 'Gujarati',
    'ht': 'Haitian Creole',
    'ha': 'Hausa',
    'haw': 'Hawaiian',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'hmn': 'Hmong',
    'hu': 'Hungarian',
    'is': 'Icelandic',
    'ig': 'Igbo',
    'id': 'Indonesian',
    'ga': 'Irish',
    'it': 'Italian',
    'ja': 'Japanese',
    'jv': 'Javanese',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'rw': 'Kinyarwanda',
    'ko': 'Korean',
    'ku': 'Kurdish',
    'ky': 'Kyrgyz',
    'lo': 'Lao',
    'la': 'Latin',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'lb': 'Luxembourgish',
    'mk': 'Macedonian',
    'mg': 'Malagasy',
    'ms': 'Malay',
    'ml': 'Malayalam',
    'mt': 'Maltese',
    'mi': 'Maori',
    'mr': 'Marathi',
    'mn': 'Mongolian',
    'my': 'Myanmar (Burmese)',
    'ne': 'Nepali',
    'no': 'Norwegian',
    'or': 'Odia (Oriya)',
    'ps': 'Pashto',
    'fa': 'Persian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'pa': 'Punjabi',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sm': 'Samoan',
    'gd': 'Scots Gaelic',
    'sr': 'Serbian',
    'st': 'Sesotho',
    'sn': 'Shona',
    'sd': 'Sindhi',
    'si': 'Sinhala',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'so': 'Somali',
    'es': 'Spanish',
    'su': 'Sundanese',
    'sw': 'Swahili',
    'sv': 'Swedish',
    'tg': 'Tajik',
    'ta': 'Tamil',
    'tt': 'Tatar',
    'te': 'Telugu',
    'th': 'Thai',
    'tr': 'Turkish',
    'tk': 'Turkmen',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'ug': 'Uyghur',
    'uz': 'Uzbek',
    'vi': 'Vietnamese',
    'cy': 'Welsh',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'zu': 'Zulu'
};

// GET /languages (exact match to languages.py)
router.get('/languages', asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching supported languages list');
        
        // Return the languages dictionary (matching GoogleTranslator().get_supported_languages(as_dict=True))
        res.json(SUPPORTED_LANGUAGES);
        
    } catch (error) {
        logger.error(`Failed to fetch languages: ${error.message}`);
        throw new HTTPException(500, "Failed to fetch supported languages");
    }
}));

// GET /languages/codes (additional endpoint for just language codes)
router.get('/languages/codes', asyncHandler(async (req, res) => {
    try {
        const codes = Object.keys(SUPPORTED_LANGUAGES);
        res.json(codes);
    } catch (error) {
        logger.error(`Failed to fetch language codes: ${error.message}`);
        throw new HTTPException(500, "Failed to fetch language codes");
    }
}));

// GET /languages/detect (endpoint to detect language of text)
router.post('/languages/detect', asyncHandler(async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            throw new HTTPException(400, "Text is required for language detection");
        }
        
        // Use google-translate-api-x to detect language
        const result = await translate(text, { to: 'en' }); // Translate to English to get source language
        
        res.json({
            detected_language: result.from.language.iso,
            language_name: SUPPORTED_LANGUAGES[result.from.language.iso] || 'Unknown',
            confidence: result.from.language.didYouMean ? 0.7 : 0.9, // Approximate confidence
            text_sample: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });
        
    } catch (error) {
        logger.error(`Language detection failed: ${error.message}`);
        throw new HTTPException(500, "Language detection failed");
    }
}));

// GET /languages/validate (endpoint to validate language code)
router.get('/languages/validate/:code', asyncHandler(async (req, res) => {
    const { code } = req.params;
    
    const isValid = code in SUPPORTED_LANGUAGES;
    
    res.json({
        language_code: code,
        is_valid: isValid,
        language_name: isValid ? SUPPORTED_LANGUAGES[code] : null
    });
}));

module.exports = router;
