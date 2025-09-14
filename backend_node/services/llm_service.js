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
                this.modelConfig = {
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.1,
                    max_tokens: 4000,
                    timeout: 90000
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

    // ✅ CRITICAL FIX: Enhanced JSON parsing with multiple fallback strategies
    safeJsonParse(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }

        // Strategy 1: Direct JSON parse
        try {
            const parsed = JSON.parse(text.trim());
            logger.legalSuccess("✅ Direct JSON parsing successful");
            return parsed;
        } catch (directError) {
            logger.legalWarning("⚠️ Direct JSON parsing failed, trying extraction strategies");
        }

        // Strategy 2: Extract JSON block with code fence
        try {
            const codeBlockMatch = text.match(/``````/i);
            if (codeBlockMatch) {
                const parsed = JSON.parse(codeBlockMatch[1].trim());
                logger.legalSuccess("✅ Code block JSON extraction successful");
                return parsed;
            }
        } catch (codeBlockError) {
            logger.legalWarning("⚠️ Code block JSON extraction failed");
        }

        // Strategy 3: Extract first complete JSON object
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonText = jsonMatch[0];
                const parsed = JSON.parse(jsonText);
                logger.legalSuccess("✅ JSON object extraction successful");
                return parsed;
            }
        } catch (objectError) {
            logger.legalWarning("⚠️ JSON object extraction failed");
        }

        // Strategy 4: Fix common JSON issues and retry
        try {
            let fixedText = text
                // Remove any text before first {
                .substring(text.indexOf('{'))
                // Remove any text after last }
                .substring(0, text.lastIndexOf('}') + 1)
                // Fix common quote issues
                .replace(/'/g, '"')
                // Fix trailing commas
                .replace(/,(\s*[}\]])/g, '$1')
                // Fix unescaped quotes in strings
                .replace(/(?<!\\)"/g, '\\"')
                .replace(/\\"/g, '"');

            const parsed = JSON.parse(fixedText);
            logger.legalSuccess("✅ Fixed JSON parsing successful");
            return parsed;
        } catch (fixError) {
            logger.legalWarning("⚠️ Fixed JSON parsing failed");
        }

        // Strategy 5: Lenient JSON-like parsing
        try {
            // Extract key-value pairs and construct JSON
            const keyValuePairs = [];
            
            // Look for "key": "value" patterns
            const patterns = [
                /"([^"]+)":\s*"([^"]*)"/g,
                /"([^"]+)":\s*(\d+\.?\d*)/g,
                /"([^"]+)":\s*(true|false)/g,
                /"([^"]+)":\s*\[([^\]]*)\]/g
            ];

            let result = {};
            
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    const key = match[1];
                    let value = match[2];
                    
                    // Type conversion
                    if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (!isNaN(value) && value !== '') value = parseFloat(value);
                    else if (match[0].includes('[')) {
                        // Array handling
                        try {
                            value = JSON.parse(`[${value}]`);
                        } catch {
                            value = value.split(',').map(v => v.trim().replace(/['"]/g, ''));
                        }
                    }
                    
                    result[key] = value;
                }
            }

            if (Object.keys(result).length > 0) {
                logger.legalSuccess("✅ Lenient JSON parsing successful");
                return result;
            }
        } catch (lenientError) {
            logger.legalWarning("⚠️ Lenient JSON parsing failed");
        }

        logger.legalError("❌ All JSON parsing strategies failed");
        return null;
    }

    async callGroqEnhanced(prompt, systemMessage = null) {
        if (!this.groqLlm) {
            throw new Error("Enhanced Groq LLM is not configured or initialized");
        }

        if (!systemMessage) {
            systemMessage = `You are a senior legal analyst with expertise in contract review, risk assessment, and legal document analysis.

Your responses must be:
- Accurate and based solely on the provided contract content
- Professional and legally sound
- Structured in the exact JSON format requested
- Detailed enough to be actionable

CRITICAL: You MUST respond with valid JSON only. Do not include any text before or after the JSON object. Do not use markdown code blocks. Return raw JSON only.

Always analyze the specific contract terms and conditions provided to you.`;
        }

        const messages = [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
        ];

        try {
            logger.aiInfo(`🤖 Calling enhanced LLM with ${prompt.length} character prompt`);

            const maxRetries = 3;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await this._makeGroqRequest(messages, this.modelConfig);
                    const content = response.trim();
                    
                    logger.aiInfo(`🤖 LLM response received: ${content.length} characters`);

                    // ✅ CRITICAL FIX: Use enhanced JSON parsing
                    const parsed = this.safeJsonParse(content);
                    
                    if (parsed) {
                        logger.legalSuccess("✅ LLM response successfully parsed to JSON");
                        return parsed;
                    } else {
                        logger.legalWarning(`⚠️ Attempt ${attempt + 1}: JSON parsing failed, raw response: ${content.substring(0, 200)}...`);
                        
                        if (attempt === maxRetries - 1) {
                            // Create structured fallback response
                            return {
                                success: false,
                                content: content,
                                error: "JSON parsing failed after all attempts",
                                raw_response: content.substring(0, 500)
                            };
                        }
                    }

                } catch (callError) {
                    logger.legalWarning(`⚠️ LLM call attempt ${attempt + 1} failed: ${callError.message}`);
                    if (attempt === maxRetries - 1) {
                        throw callError;
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

        } catch (error) {
            logger.legalError(`❌ Enhanced Groq call failed: ${error.message}`);
            return {
                error: `LLM analysis failed: ${error.message}`,
                success: false,
                fallback_required: true
            };
        }
    }

    async callGroqDirectEnhanced(prompt, systemMessage = null) {
        if (!this.groqApiKey) {
            throw new Error("Groq API key not configured");
        }

        try {
            const messages = [];
            if (systemMessage) {
                messages.push({ role: "system", content: systemMessage });
            }
            messages.push({ role: "user", content: prompt });

            const payload = {
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.1,
                max_tokens: 4000,
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
                    timeout: 90000
                }
            );

            if (response.status !== 200) {
                logger.legalError(`Groq API error: ${response.status} - ${response.data}`);
                throw new Error(`Groq API error: ${response.status}`);
            }

            const content = response.data.choices[0].message.content.trim();
            logger.legalSuccess(`✅ Direct API response received: ${content.length} characters`);

            // ✅ CRITICAL FIX: Use enhanced JSON parsing
            const parsed = this.safeJsonParse(content);
            
            if (parsed) {
                return parsed;
            } else {
                // Return structured response even if JSON parsing fails
                return { 
                    result: content, 
                    success: true, 
                    json_parse_failed: true,
                    raw_content: content.substring(0, 1000)
                };
            }

        } catch (error) {
            logger.legalError(`❌ Enhanced direct API call failed: ${error.message}`);
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
            return await this.callGroqEnhanced(prompt, systemMessage);
        } catch (langchainError) {
            logger.legalWarning(`⚠️ Enhanced method failed: ${langchainError.message}`);
            try {
                return await this.callGroqDirectEnhanced(prompt, systemMessage);
            } catch (directError) {
                logger.legalError(`❌ All enhanced methods failed: ${directError.message}`);
                
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
                "Improved JSON response parsing with multiple fallback strategies",
                "Robust error handling with fallbacks"
            ],
            updated_at: "2025-09-13"
        };
    }
}

const llmService = new EnhancedLLMService();

module.exports = llmService;
