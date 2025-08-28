import json
import httpx
import logging
from typing import Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY not found in config settings")
            self.groq_llm = None
        else:
            # Initialize Groq with LangChain
            try:
                self.groq_llm = ChatGroq(
                    api_key=self.groq_api_key,
                    model="llama3-8b-8192",  # Use "llama3-70b-8192" for more accuracy if needed
                    temperature=0.1,
                    max_tokens=2000,
                    timeout=30
                )
                logger.info("Groq LLM initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Groq LLM: {str(e)}")
                self.groq_llm = None

    async def call_groq_with_langchain(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Call Groq LLM using LangChain"""
        if not self.groq_llm:
            raise ValueError("Groq LLM is not configured or initialized")
        messages = []
        if system_message:
            messages.append(SystemMessage(content=system_message))
        messages.append(HumanMessage(content=prompt))
        try:
            response = await self.groq_llm.ainvoke(messages)
            try:
                return json.loads(response.content)
            except json.JSONDecodeError:
                return {"result": response.content}
        except Exception as e:
            logger.error(f"Groq LangChain call failed: {str(e)}")
            raise Exception(f"LLM call failed: {str(e)}")

    async def call_groq_direct(self, prompt: str, model: str = "llama3-8b-8192") -> Dict[str, Any]:
        """Call Groq Model via direct API request"""
        if not self.groq_api_key:
            raise ValueError("Groq API key not configured in settings")
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.groq_api_key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "max_tokens": 2000
                    },
                    timeout=30.0
                )
                if response.status_code != 200:
                    raise Exception(f"Groq API error: {response.status_code} - {response.text}")
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"result": content}
            except Exception as e:
                logger.error(f"Direct Groq API call failed: {str(e)}")
                raise

    async def call_llm_with_fallback(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Try Groq with LangChain, fallback to direct Groq API request."""
        try:
            return await self.call_groq_with_langchain(prompt, system_message)
        except Exception as groq_error:
            logger.warning(f"Groq LangChain failed, trying direct API: {str(groq_error)}")
            try:
                return await self.call_groq_direct(prompt)
            except Exception as direct_error:
                logger.error(f"Direct Groq API also failed: {str(direct_error)}")
                return {"error": f"All Groq calls failed: {str(direct_error)}"}

    def create_prompt_template(self, template_str: str) -> PromptTemplate:
        """Create a LangChain prompt template."""
        return PromptTemplate.from_template(template_str)

    async def test_connection(self) -> Dict[str, Any]:
        """Test Groq LLM connection and return status."""
        test_prompt = "Reply with 'Connection successful' in JSON format: {\"status\": \"Connection successful\"}"
        results = {
            "groq_langchain": "not_tested",
            "groq_direct": "not_tested"
        }
        # Test LangChain
        if self.groq_llm:
            try:
                res = await self.call_groq_with_langchain(test_prompt)
                results["groq_langchain"] = "success"
            except Exception as e:
                results["groq_langchain"] = f"failed: {str(e)}"
        # Test direct
        if self.groq_api_key:
            try:
                res = await self.call_groq_direct(test_prompt)
                results["groq_direct"] = "success"
            except Exception as e:
                results["groq_direct"] = f"failed: {str(e)}"
        return {
            "status": "completed",
            "test_results": results,
            "primary_service": "groq"
        }

# Global LLM service instance
llm_service = LLMService()
