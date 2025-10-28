# chatbot_service.py - Chatbot with Conversation Memory for Legal Document Analysis
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.config import settings
from app.services.vector_service import vector_service
import json

logger = logging.getLogger(__name__)


class ConversationMemoryStore:
    """
    In-memory conversation storage (no database required)
    Stores conversations per session with automatic cleanup
    """
    def __init__(self):
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        self.max_conversations_per_session = 50  # Limit memory usage
        
    def add_message(self, session_id: str, role: str, content: str, document_id: Optional[str] = None):
        """Add a message to conversation history"""
        if session_id not in self.conversations:
            self.conversations[session_id] = []
            
        message = {
            "role": role,  # 'user' or 'assistant'
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "document_id": document_id
        }
        
        self.conversations[session_id].append(message)
        
        # Keep only recent messages to prevent memory overflow
        if len(self.conversations[session_id]) > self.max_conversations_per_session:
            self.conversations[session_id] = self.conversations[session_id][-self.max_conversations_per_session:]
            
        logger.info(f"💬 Added {role} message to session {session_id[:8]}... (total: {len(self.conversations[session_id])})")
        
    def get_conversation_history(self, session_id: str, last_n: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        if session_id not in self.conversations:
            return []
        return self.conversations[session_id][-last_n:]
    
    def clear_conversation(self, session_id: str):
        """Clear conversation for a session"""
        if session_id in self.conversations:
            del self.conversations[session_id]
            logger.info(f"🗑️ Cleared conversation history for session {session_id[:8]}...")
    
    def get_conversation_summary(self, session_id: str) -> Dict[str, Any]:
        """Get summary of conversation"""
        if session_id not in self.conversations:
            return {"message_count": 0, "exists": False}
            
        messages = self.conversations[session_id]
        return {
            "message_count": len(messages),
            "exists": True,
            "first_message_time": messages[0]["timestamp"] if messages else None,
            "last_message_time": messages[-1]["timestamp"] if messages else None,
            "documents_discussed": list(set(m.get("document_id") for m in messages if m.get("document_id")))
        }


class LegalChatbotService:
    """
    Legal Document Chatbot with Memory and RAG
    """
    def __init__(self):
        self.memory_store = ConversationMemoryStore()
        self.groq_api_key = settings.GROQ_API_KEY
        
        # Initialize Groq LLM
        if self.groq_api_key:
            try:
                self.llm = ChatGroq(
                    api_key=self.groq_api_key,
                    model="llama-3.3-70b-versatile",
                    temperature=0.3,  # Slightly higher for conversational responses
                    max_tokens=2000,
                    timeout=60
                )
                logger.info("✅ Legal Chatbot LLM initialized with Llama 3.3 70B")
            except Exception as e:
                logger.error(f"Failed to initialize chatbot LLM: {str(e)}")
                self.llm = None
        else:
            logger.warning("GROQ_API_KEY not configured for chatbot")
            self.llm = None
            
        # System prompt for legal chatbot
        self.system_prompt = """You are an expert legal assistant specializing in contract analysis and legal document review. 

Your capabilities:
- Answer questions about uploaded legal documents using RAG (Retrieval Augmented Generation)
- Explain legal terms and clauses in simple language
- Identify risks and important provisions in contracts
- Provide insights on contract terms and obligations
- Remember previous conversation context to provide coherent responses

Guidelines:
- Base your answers on the retrieved document content when available
- If asked about a document, always reference specific sections or clauses
- Be professional, accurate, and concise
- If you don't have information, clearly state that
- Remember the conversation history to provide contextual responses
- Don't make up information - only use what's in the documents or conversation

When no document context is provided, answer general legal questions professionally."""
        
    async def chat(
        self, 
        session_id: str, 
        user_message: str, 
        document_id: Optional[str] = None,
        use_rag: bool = True
    ) -> Dict[str, Any]:
        """
        Main chat method with memory and optional RAG
        
        Args:
            session_id: User session ID
            user_message: User's question/message
            document_id: Optional document ID for RAG
            use_rag: Whether to retrieve document context
        """
        try:
            logger.info(f"💬 Chat request - Session: {session_id[:8]}..., Message: '{user_message[:50]}...', Doc: {document_id}, RAG: {use_rag}")
            
            # Step 1: Retrieve relevant document context if document_id provided
            document_context = ""
            relevant_chunks = []
            
            if use_rag and document_id:
                session_document_id = f"{session_id}_{document_id}"
                try:
                    chunks = await vector_service.retrieve_relevant_chunks(
                        query=user_message,
                        document_id=session_document_id,
                        top_k=5
                    )
                    
                    if chunks:
                        document_context = "\n\n".join([
                            f"[Section {chunk['chunk_index']}]: {chunk['text']}"
                            for chunk in chunks
                        ])
                        relevant_chunks = chunks
                        logger.info(f"📄 Retrieved {len(chunks)} relevant chunks from document")
                    else:
                        logger.warning(f"⚠️ No chunks found for document {document_id}")
                        document_context = "No relevant document content found. The document may not be uploaded or indexed yet."
                        
                except Exception as e:
                    logger.error(f"Failed to retrieve document context: {str(e)}")
                    document_context = "Error retrieving document content."
            
            # Step 2: Get conversation history
            conversation_history = self.memory_store.get_conversation_history(session_id, last_n=10)
            
            # Step 3: Build context-aware prompt
            messages = [SystemMessage(content=self.system_prompt)]
            
            # Add conversation history
            for msg in conversation_history[-6:]:  # Last 3 exchanges (6 messages)
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
            
            # Build current user message with context
            current_message = user_message
            if document_context:
                current_message = f"""User Question: {user_message}

Relevant Document Content:
{document_context}

Please answer the user's question based on the document content provided above. Reference specific sections when possible."""
            
            messages.append(HumanMessage(content=current_message))
            
            # Step 4: Generate response
            if not self.llm:
                raise ValueError("Chatbot LLM not initialized")
                
            logger.info("🤖 Generating chatbot response...")
            response = await self.llm.ainvoke(messages)
            bot_response = response.content.strip()
            
            # Step 5: Store conversation in memory
            self.memory_store.add_message(
                session_id=session_id,
                role="user",
                content=user_message,
                document_id=document_id
            )
            
            self.memory_store.add_message(
                session_id=session_id,
                role="assistant",
                content=bot_response,
                document_id=document_id
            )
            
            logger.info(f"✅ Chatbot response generated: {len(bot_response)} characters")
            
            return {
                "response": bot_response,
                "document_id": document_id,
                "used_rag": use_rag and bool(document_context),
                "chunks_retrieved": len(relevant_chunks),
                "relevant_sections": [
                    {
                        "chunk_index": chunk["chunk_index"],
                        "text_preview": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                        "relevance_score": chunk.get("score", 0.0)
                    }
                    for chunk in relevant_chunks
                ],
                "conversation_turn": len(conversation_history) // 2 + 1,
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"❌ Chatbot error: {str(e)}")
            return {
                "response": f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again.",
                "error": str(e),
                "document_id": document_id,
                "used_rag": False,
                "chunks_retrieved": 0,
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id
            }
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for a session"""
        return self.memory_store.get_conversation_history(session_id, last_n=50)
    
    def clear_conversation(self, session_id: str):
        """Clear conversation history"""
        self.memory_store.clear_conversation(session_id)
        
    def get_conversation_summary(self, session_id: str) -> Dict[str, Any]:
        """Get conversation summary"""
        return self.memory_store.get_conversation_summary(session_id)
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for chatbot service"""
        try:
            test_response = await self.chat(
                session_id="health_check_session",
                user_message="Hello, this is a test",
                use_rag=False
            )
            
            # Clean up test conversation
            self.clear_conversation("health_check_session")
            
            return {
                "status": "healthy",
                "llm_initialized": self.llm is not None,
                "model": "llama-3.3-70b-versatile",
                "memory_store_active": True,
                "test_response_generated": bool(test_response.get("response")),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


# Global chatbot service instance
chatbot_service = LegalChatbotService()
