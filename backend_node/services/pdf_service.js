// services/pdf_service.js - Robust PDF Text Extraction (Simplified)

const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');
const crypto = require('crypto');

class EnhancedPDFService {
    constructor() {
        // ✅ SIMPLIFIED: Use only pdf-parse for now (reliable method)
        this.extractionMethods = [
            this._extractWithPdfParse,
            // Note: OCR removed for stability - can be added later with proper PDF-to-image conversion
        ];
        
        logger.info("Enhanced PDF Service initialized with pdf-parse");
    }

    async extractTextFromPdf(pdfContent) {
        let bestExtraction = null;
        let bestScore = 0;
        let allResults = [];

        logger.processingInfo(`🔍 Starting enhanced PDF extraction with ${this.extractionMethods.length} methods`);

        // Try all extraction methods with detailed logging
        for (const method of this.extractionMethods) {
            try {
                const result = await method.call(this, pdfContent);
                const score = this._scoreExtractionQuality(result.text);
                
                allResults.push({
                    method: result.method,
                    score: score.toFixed(2),
                    textLength: result.text.length,
                    success: true
                });
                
                logger.processingInfo(`Method ${method.name}: ${score.toFixed(2)} quality score (${result.text.length} chars)`);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestExtraction = result;
                }
            } catch (error) {
                allResults.push({
                    method: method.name,
                    score: 0,
                    textLength: 0,
                    success: false,
                    error: error.message
                });
                
                logger.legalWarning(`Method ${method.name} failed: ${error.message}`);
                continue;
            }
        }

        // ✅ SIMPLIFIED: Accept lower quality scores (was 1.0, now 0.5)
        if (bestExtraction && bestScore >= 0.5) {
            const cleanedText = this._cleanExtractedText(bestExtraction.text);
            
            logger.legalSuccess(`🎉 PDF extraction completed successfully!`);
            logger.processingInfo(`✅ Best method: ${bestExtraction.method} (score: ${bestScore.toFixed(2)})`);
            
            return {
                text: cleanedText,
                method_used: bestExtraction.method,
                quality_score: bestScore,
                page_count: bestExtraction.page_count || 1,
                extraction_attempts: allResults
            };
        } else {
            logger.legalError(`❌ PDF extraction failed or returned low quality results`);
            
            // ✅ IMPROVED: More helpful error message
            const errorMessage = `PDF text extraction failed. This might be a scanned PDF or image-based document. ` +
                                `Extracted: ${bestExtraction ? bestExtraction.text.length : 0} characters with quality score: ${bestScore.toFixed(2)}. ` +
                                `For scanned documents, please convert to searchable PDF first.`;
            throw new Error(errorMessage);
        }
    }

    // ✅ ENHANCED: Better validation and logging
    async _extractWithPdfParse(pdfContent) {
        try {
            const pdfBuffer = Buffer.isBuffer(pdfContent) ? pdfContent : Buffer.from(pdfContent);
            
            logger.processingInfo(`📄 Attempting pdf-parse extraction on ${pdfBuffer.length} byte buffer`);
            
            const data = await pdfParse(pdfBuffer);
            
            // ✅ IMPROVED: More lenient validation (was 10, now 5)
            if (!data.text || data.text.trim().length < 5) {
                throw new Error(`pdf-parse returned insufficient text (${data.text ? data.text.length : 0} chars)`);
            }
            
            const cleanText = data.text.trim();
            
            logger.legalSuccess(`📄 pdf-parse extracted ${cleanText.length} characters from ${data.numpages || 1} pages`);
            
            return {
                text: cleanText,
                method: 'pdf-parse',
                page_count: data.numpages || 1
            };
        } catch (error) {
            logger.legalError(`pdf-parse extraction failed: ${error.message}`);
            throw error;
        }
    }

    // ✅ IMPROVED: More generous quality scoring
    _scoreExtractionQuality(text) {
        if (!text || text.trim().length < 5) {
            return 0.0;
        }

        let score = 0.0;
        const cleanText = text.trim();

        // Basic text length check (more generous)
        if (cleanText.length > 10) score += 1.0;
        if (cleanText.length > 50) score += 1.0;
        if (cleanText.length > 200) score += 1.0;

        // Check for coherent sentences
        const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 0) score += 1.0;

        // Check for words
        const words = cleanText.split(/\s+/);
        if (words.length > 5) score += 1.0;

        // Check for legal document indicators
        const legalTerms = ['agreement', 'contract', 'terms', 'conditions', 'party', 'obligations', 'shall', 'company', 'employee', 'service'];
        const foundTerms = legalTerms.filter(term => cleanText.toLowerCase().includes(term.toLowerCase())).length;
        score += foundTerms * 0.5;

        return Math.max(0.0, Math.min(10.0, score));
    }

    // Clean extracted text (unchanged)
    _cleanExtractedText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        // Remove excessive whitespace
        text = text.replace(/\s+/g, ' ');

        // Fix common PDF extraction issues
        text = text.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add missing spaces
        text = text.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2'); // Fix hyphenated words
        text = text.replace(/\n{3,}/g, '\n\n'); // Remove excessive newlines

        return text.trim();
    }

    // Health check method
    async healthCheck() {
        try {
            return {
                status: 'healthy',
                methods_available: ['pdf-parse'],
                features: [
                    'Text extraction',
                    'Quality scoring',
                    'Text cleaning and normalization'
                ],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    getServiceInfo() {
        return {
            service: 'Enhanced PDF Service',
            methods: ['pdf-parse'],
            features: [
                'PDF text extraction',
                'Quality scoring', 
                'Text cleaning and normalization',
                'Legal document optimization'
            ],
            version: '1.0.0'
        };
    }
}

// Global PDF service instance
const pdfService = new EnhancedPDFService();

module.exports = pdfService;
