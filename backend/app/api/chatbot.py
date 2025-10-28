# chatbot.py - API endpoints for Legal Chatbot with Memory
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
from app.services.chatbot_service import chatbot_service
from app.api.auth import get_current_session

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    document_id: Optional[str] = None
    use_rag: bool = True  # Whether to use RAG for document context


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str
    document_id: Optional[str]
    used_rag: bool
    chunks_retrieved: int
    relevant_sections: List[Dict[str, Any]]
    conversation_turn: int
    timestamp: str
    session_id: str


class ConversationHistoryResponse(BaseModel):
    """Conversation history response"""
    messages: List[Dict[str, Any]]
    message_count: int
    session_id: str
    timestamp: str


class ConversationSummaryResponse(BaseModel):
    """Conversation summary response"""
    message_count: int
    exists: bool
    first_message_time: Optional[str]
    last_message_time: Optional[str]
    documents_discussed: List[str]
    session_id: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(
    request: ChatRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    Chat with legal documents using RAG and conversation memory
    
    Features:
    - Remembers conversation context
    - Retrieves relevant document sections
    - Provides contextual answers based on documents
    - Maintains conversation flow
    """
    try:
        session_id = current_session["session_id"]
        
        logger.info(f"💬 CHATBOT REQUEST")
        logger.info(f"   Session: {session_id[:8]}...")
        logger.info(f"   Message: '{request.message[:100]}...'")
        logger.info(f"   Document: {request.document_id}")
        logger.info(f"   Use RAG: {request.use_rag}")
        
        # Validate message
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Chat with bot
        result = await chatbot_service.chat(
            session_id=session_id,
            user_message=request.message.strip(),
            document_id=request.document_id,
            use_rag=request.use_rag
        )
        
        if "error" in result:
            logger.warning(f"⚠️ Chatbot returned error: {result['error']}")
        
        logger.info(f"✅ Chatbot response generated successfully")
        
        return ChatResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Chat endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/conversation/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    current_session: dict = Depends(get_current_session)
):
    """
    Get conversation history for current session
    """
    try:
        session_id = current_session["session_id"]
        
        messages = chatbot_service.get_conversation_history(session_id)
        
        return ConversationHistoryResponse(
            messages=messages,
            message_count=len(messages),
            session_id=session_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get conversation history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation history")


@router.get("/conversation/summary", response_model=ConversationSummaryResponse)
async def get_conversation_summary(
    current_session: dict = Depends(get_current_session)
):
    """
    Get summary of conversation for current session
    """
    try:
        session_id = current_session["session_id"]
        
        summary = chatbot_service.get_conversation_summary(session_id)
        summary["session_id"] = session_id
        
        return ConversationSummaryResponse(**summary)
        
    except Exception as e:
        logger.error(f"Failed to get conversation summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation summary")


@router.delete("/conversation/clear")
async def clear_conversation(
    current_session: dict = Depends(get_current_session)
):
    """
    Clear conversation history for current session
    """
    try:
        session_id = current_session["session_id"]
        
        chatbot_service.clear_conversation(session_id)
        
        logger.info(f"🗑️ Cleared conversation for session {session_id[:8]}...")
        
        return {
            "message": "Conversation history cleared successfully",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to clear conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear conversation")


@router.get("/health")
async def chatbot_health_check():
    """
    Health check for chatbot service
    """
    try:
        health_status = await chatbot_service.health_check()
        
        return {
            "service": "Legal Document Chatbot",
            "features": [
                "Conversation memory",
                "RAG-based document Q&A",
                "Context-aware responses",
                "Multi-turn conversations"
            ],
            "health": health_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chatbot health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")


# Example usage endpoint for documentation
@router.get("/examples")
async def get_chatbot_examples():
    """
    Get example queries for the chatbot
    """
    return {
        "examples": {
            "general_questions": [
                "What is a service bond?",
                "Explain liquidated damages in simple terms",
                "What are common risks in employment contracts?"
            ],
            "document_specific": [
                "What are the payment terms in this contract?",
                "Does this agreement have a non-compete clause?",
                "What is the notice period for termination?",
                "Are there any penalties mentioned in the contract?"
            ],
            "follow_up_questions": [
                "Can you explain that in simpler terms?",
                "What does that mean for me?",
                "Are there any risks with this clause?",
                "What should I negotiate?"
            ]
        },
        "usage_tips": [
            "Upload a document first before asking document-specific questions",
            "The chatbot remembers your conversation, so you can ask follow-up questions",
            "Ask specific questions for better answers",
            "You can ask general legal questions without uploading a document"
        ]
    }


# Export router
chatbot_router = router
