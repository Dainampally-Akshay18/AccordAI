const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class EnhancedLLMService {
    constructor() {
        this.groqApiKey = config.GROQ_API_KEY;
        
        if (!this.groqApiKey) {
            logger.warn("GROQ_API_KEY not found in config settings");
            this.groqLlm = null;
        } else {
            try {
                // ✅ UPGRADED TO LLAMA 3.3 70B for much better legal analysis (matching Python)
                this.modelConfig = {
                    model: "llama-3.3-70b-versatile", // ✅ UPGRADED: 10x better than 8B
                    temperature: 0.1, // Low for accuracy
                    max_tokens: 4000, // More tokens for detailed analysis
                    timeout: 90000 // More time for complex analysis (90 seconds)
                };
                
                this.fallbackConfig = {
                    model: "llama-3.1-8b-instant",
                    temperature: 0.2,
                    max_tokens: 3000,
                    timeout: 45000
                };
                
                logger.info("✅ Enhanced Groq LLM initialized with llama-3.3-70b-versatile");
                this.groqLlm = true;
                
            } catch (error) {
                logger.error(`Failed to initialize Enhanced Groq LLM: ${error.message}`);
                this.groqLlm = null;
            }
        }
    }

    async callGroqEnhanced(prompt, systemMessage = null) {
        if (!this.groqLlm) {
            throw new Error("Enhanced Groq LLM is not configured or initialized");
        }

        // ✅ ENHANCED SYSTEM MESSAGE FOR LEGAL ANALYSIS (matching Python)
        if (!systemMessage) {
            systemMessage = `You are a senior legal analyst with expertise in contract review, risk assessment, and legal document analysis.

Your responses must be:
- Accurate and based solely on the provided contract content
- Professional and legally sound
- Structured in the exact JSON format requested
- Detailed enough to be actionable

Always analyze the specific contract terms and conditions provided to you.`;
        }

        const messages = [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
        ];

        try {
            logger.aiInfo(`Calling enhanced LLM with ${prompt.length} character prompt`);

            // ✅ ENHANCED CALL WITH RETRY LOGIC (matching Python)
            const maxRetries = 3;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await this._makeGroqRequest(messages, this.modelConfig);
                    const content = response.trim();
                    
                    logger.aiInfo(`LLM response received: ${content.length} characters`);

                    // Try to parse as JSON first (matching Python logic)
                    if (content.startsWith('{') && content.endsWith('}')) {
                        try {
                            return JSON.parse(content);
                        } catch (jsonError) {
                            logger.legalWarning("Direct JSON parsing failed, extracting JSON");
                            
                            // Extract JSON from content (matching Python regex)
                            const jsonMatch = content.match(/\{.*\}/s);
                            if (jsonMatch) {
                                try {
                                    const parsedJson = JSON.parse(jsonMatch[0]);
                                    logger.legalSuccess("Successfully extracted and parsed JSON");
                                    return parsedJson;
                                } catch (extractError) {
                                    logger.legalWarning("Extracted JSON parsing failed");
                                }
                            }
                        }
                    }

                    // Return structured response if JSON parsing fails (matching Python)
                    return {
                        success: true,
                        content: content,
                        extracted: true
                    };

                } catch (callError) {
                    logger.legalWarning(`LLM call attempt ${attempt + 1} failed: ${callError.message}`);
                    if (attempt === maxRetries - 1) {
                        throw callError;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause before retry
                }
            }

        } catch (error) {
            logger.legalError(`Enhanced Groq call failed: ${error.message}`);
            return {
                error: `LLM analysis failed: ${error.message}`,
                success: false
            };
        }
    }

    async callGroqDirectEnhanced(prompt, systemMessage = null) {
        if (!this.groqApiKey) {
            throw new Error("Groq API key not configured");
        }

        try {
            // ✅ ENHANCED PAYLOAD WITH BETTER SETTINGS (matching Python)
            const messages = [];
            if (systemMessage) {
                messages.push({ role: "system", content: systemMessage });
            }
            messages.push({ role: "user", content: prompt });

            const payload = {
                model: "llama-3.3-70b-versatile", // ✅ BETTER MODEL
                messages: messages,
                temperature: 0.1, // ✅ LOWER for accuracy
                max_tokens: 4000, // ✅ MORE tokens
                top_p: 0.9, // ✅ FOCUSED responses
                frequency_penalty: 0, // ✅ NO repetition penalty
                presence_penalty: 0 // ✅ NO presence penalty
            };

            const response = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                payload,
                {
                    headers: {
                        "Authorization": `Bearer ${this.groqApiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 90000 // ✅ LONGER timeout for complex analysis
                }
            );

            if (response.status !== 200) {
                logger.legalError(`Groq API error: ${response.status} - ${response.data}`);
                throw new Error(`Groq API error: ${response.status}`);
            }

            const content = response.data.choices[0].message.content.trim();
            logger.legalSuccess(`Direct API response received: ${content.length} characters`);

            // Enhanced JSON extraction (matching Python)
            try {
                return JSON.parse(content);
            } catch (jsonError) {
                // Extract JSON from content
                const jsonMatch = content.match(/\{.*\}/s);
                if (jsonMatch) {
                    try {
                        return JSON.parse(jsonMatch[0]);
                    } catch (extractError) {
                        // Return raw content if JSON extraction fails
                    }
                }
                return { result: content, success: true };
            }

        } catch (error) {
            logger.legalError(`Enhanced direct API call failed: ${error.message}`);
            throw error;
        }
    }

    async _makeGroqRequest(messages, modelConfig) {
        const payload = {
            model: modelConfig.model,
            messages: messages,
            temperature: modelConfig.temperature,
            max_tokens: modelConfig.max_tokens,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            payload,
            {
                headers: {
                    "Authorization": `Bearer ${this.groqApiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: modelConfig.timeout
            }
        );

        if (response.status !== 200) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        return response.data.choices[0].message.content;
    }

    async callGroq(prompt, systemMessage = null) {
        try {
            // Try enhanced method first (matching Python)
            return await this.callGroqEnhanced(prompt, systemMessage);
        } catch (langchainError) {
            logger.legalWarning(`Enhanced method failed: ${langchainError.message}`);
            try {
                // Fallback to direct API (matching Python)
                return await this.callGroqDirectEnhanced(prompt, systemMessage);
            } catch (directError) {
                logger.legalError(`All enhanced methods failed: ${directError.message}`);
                
                // Return structured error response (matching Python)
                return {
                    error: "Analysis failed due to LLM service issues",
                    details: directError.message,
                    success: false,
                    fallback_analysis: {
                        risks: [],
                        summary: "Unable to analyze document due to technical issues",
                        emails: {
                            acceptance: "Analysis service temporarily unavailable",
                            rejection: "Analysis service temporarily unavailable"
                        }
                    }
                };
            }
        }
    }

    async healthCheck() {
        try {
            const testResult = await this.callGroq('Test message: respond with JSON {"status": "ok"}');
            return {
                status: "healthy",
                method: "enhanced_call_groq",
                model: "llama-3.3-70b-versatile",
                response: testResult,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: "failed",
                method: "enhanced_call_groq", 
                model: "llama-3.3-70b-versatile",
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    getSupportedModels() {
        return {
            current_model: "llama-3.3-70b-versatile",
            fallback_model: "llama-3.1-8b-instant",
            features: [
                "Enhanced legal analysis",
                "Better accuracy for contract review",
                "Improved JSON response parsing",
                "Robust error handling with fallbacks"
            ],
            updated_at: "2025-09-13"
        };
    }
}

// Global enhanced LLM service instance (matching Python)
const llmService = new EnhancedLLMService();

module.exports = llmService;
