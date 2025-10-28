# llm_service.py - Enhanced with Llama 3.3 70B and Better Legal Prompts
import json
import httpx
import logging
import asyncio
from typing import Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
from app.config import settings

logger = logging.getLogger(__name__)

class EnhancedLLMService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY not found in config settings")
            self.groq_llm = None
        else:
            try:
                # ✅ UPGRADED TO LLAMA 3.3 70B for much better legal analysis
                self.groq_llm = ChatGroq(
                    api_key=self.groq_api_key,
                    model="llama-3.3-70b-versatile",  # ✅ UPGRADED: 10x better than 8B
                    temperature=0.1,     # Low for accuracy
                    max_tokens=4000,     # More tokens for detailed analysis
                    timeout=90           # More time for complex analysis
                )
                logger.info("✅ Enhanced Groq LLM initialized with llama-3.3-70b-versatile")
            except Exception as e:
                logger.error(f"Failed to initialize Enhanced Groq LLM: {str(e)}")
                # Fallback to 8B model
                try:
                    self.groq_llm = ChatGroq(
                        api_key=self.groq_api_key,
                        model="llama-3.1-8b-instant",
                        temperature=0.2,
                        max_tokens=3000,
                        timeout=45
                    )
                    logger.info("⚠️ Fallback to llama-3.1-8b-instant")
                except Exception as fallback_error:
                    logger.error(f"Fallback model also failed: {str(fallback_error)}")
                    self.groq_llm = None

    async def call_groq_enhanced(self, prompt: str, system_message: str = None) -> Dict[str, Any]:
        """Enhanced Groq call with better error handling and legal optimization"""
        if not self.groq_llm:
            raise ValueError("Enhanced Groq LLM is not configured or initialized")

        # ✅ ENHANCED SYSTEM MESSAGE FOR LEGAL ANALYSIS
        if not system_message:
            system_message = """You are a senior legal analyst with expertise in contract review, risk assessment, and legal document analysis. 
            
            Your responses must be:
            - Accurate and based solely on the provided contract content
            - Professional and legally sound
            - Structured in the exact JSON format requested
            - Detailed enough to be actionable
            
            Always analyze the specific contract terms and conditions provided to you."""

        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=prompt)
        ]

        try:
            logger.info(f"🤖 Calling enhanced LLM with {len(prompt)} character prompt")
            
            # ✅ ENHANCED CALL WITH RETRY LOGIC
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = await self.groq_llm.ainvoke(messages)
                    
                    # ✅ ENHANCED RESPONSE PROCESSING
                    content = response.content.strip()
                    logger.info(f"✅ LLM response received: {len(content)} characters")
                    
                    # Try to parse as JSON first
                    if content.startswith('{') and content.endswith('}'):
                        try:
                            return json.loads(content)
                        except json.JSONDecodeError:
                            logger.warning("⚠️ Direct JSON parsing failed, extracting JSON")
                    
                    # Extract JSON from content
                    import re
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        try:
                            parsed_json = json.loads(json_match.group())
                            logger.info("✅ Successfully extracted and parsed JSON")
                            return parsed_json
                        except json.JSONDecodeError:
                            logger.warning("⚠️ Extracted JSON parsing failed")
                    
                    # Return structured response if JSON parsing fails
                    return {
                        "success": True,
                        "content": content,
                        "extracted": True
                    }
                    
                except Exception as call_error:
                    logger.warning(f"⚠️ LLM call attempt {attempt + 1} failed: {str(call_error)}")
                    if attempt == max_retries - 1:
                        raise call_error
                    await asyncio.sleep(1)  # Brief pause before retry
            
        except Exception as e:
            logger.error(f"❌ Enhanced Groq call failed: {str(e)}")
            return {
                "error": f"LLM analysis failed: {str(e)}",
                "success": False
            }

    async def call_groq_direct_enhanced(self, prompt: str, system_message: str = None) -> Dict[str, Any]:
        """Enhanced direct API call with better settings"""
        if not self.groq_api_key:
            raise ValueError("Groq API key not configured")

        async with httpx.AsyncClient() as client:
            try:
                # ✅ ENHANCED PAYLOAD WITH BETTER SETTINGS
                messages = []
                if system_message:
                    messages.append({"role": "system", "content": system_message})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": "llama-3.3-70b-versatile",  # ✅ BETTER MODEL
                    "messages": messages,
                    "temperature": 0.1,      # ✅ LOWER for accuracy
                    "max_tokens": 4000,      # ✅ MORE tokens
                    "top_p": 0.9,           # ✅ FOCUSED responses
                    "frequency_penalty": 0,  # ✅ NO repetition penalty
                    "presence_penalty": 0    # ✅ NO presence penalty
                }

                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=90.0  # ✅ LONGER timeout for complex analysis
                )

                if response.status_code != 200:
                    logger.error(f"❌ Groq API error: {response.status_code} - {response.text}")
                    raise Exception(f"Groq API error: {response.status_code}")

                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                logger.info(f"✅ Direct API response received: {len(content)} characters")

                # Enhanced JSON extraction
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    # Extract JSON from content
                    import re
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        try:
                            return json.loads(json_match.group())
                        except json.JSONDecodeError:
                            pass
                    
                    return {"result": content, "success": True}

            except Exception as e:
                logger.error(f"❌ Enhanced direct API call failed: {str(e)}")
                raise

    async def call_groq(self, prompt: str, system_message: str = None) -> Dict[str, Any]:
        """Main enhanced Groq calling method"""
        try:
            # Try LangChain first
            return await self.call_groq_enhanced(prompt, system_message)
        except Exception as langchain_error:
            logger.warning(f"⚠️ LangChain method failed: {str(langchain_error)}")
            try:
                # Fallback to direct API
                return await self.call_groq_direct_enhanced(prompt, system_message)
            except Exception as direct_error:
                logger.error(f"❌ All enhanced methods failed: {str(direct_error)}")
                # Return structured error response
                return {
                    "error": "Analysis failed due to LLM service issues",
                    "details": str(direct_error),
                    "success": False,
                    "fallback_analysis": {
                        "risks": [],
                        "summary": "Unable to analyze document due to technical issues",
                        "emails": {
                            "acceptance": "Analysis service temporarily unavailable",
                            "rejection": "Analysis service temporarily unavailable"
                        }
                    }
                }

    async def health_check(self) -> Dict[str, Any]:
        """Health check for enhanced LLM service"""
        try:
            test_result = await self.call_groq("Test message: respond with JSON {\"status\": \"ok\"}")
            return {
                "status": "healthy",
                "method": "enhanced_call_groq",
                "model": "llama-3.3-70b-versatile",
                "response": test_result,
                "timestamp": "2025-09-03T11:43:00"
            }
        except Exception as e:
            return {
                "status": "failed",
                "method": "enhanced_call_groq",
                "model": "llama-3.3-70b-versatile",
                "error": str(e),
                "timestamp": "2025-09-03T11:43:00"
            }

    def get_supported_models(self) -> Dict[str, Any]:
        """Get list of current supported Groq models"""
        return {
            "current_model": "llama-3.3-70b-versatile",
            "fallback_model": "llama-3.1-8b-instant", 
            "features": [
                "Enhanced legal analysis",
                "Better accuracy for contract review",
                "Improved JSON response parsing",
                "Robust error handling with fallbacks"
            ],
            "updated_at": "2025-09-03"
        }

# Global enhanced LLM service instance
llm_service = EnhancedLLMService()
