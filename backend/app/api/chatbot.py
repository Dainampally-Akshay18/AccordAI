# app/api/chatbot.py
# ✨ PHASE 2A: Enhanced Conversational RAG with Multi-Turn Context
# ✅ NO BREAKING CHANGES: All route names and function signatures preserved

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
import logging
from datetime import datetime
import re

# Services
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
from app.api.auth import get_current_session

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# MODELS (UNCHANGED - Preserved for API Compatibility)
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None
    use_rag: bool = True
    history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    response: str
    chunks_retrieved: int
    relevant_sections: List[dict]
    used_rag: bool
    timestamp: str
    session_id: str

class ConversationHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    message_count: int
    session_id: str
    timestamp: str

class ConversationSummaryResponse(BaseModel):
    message_count: int
    exists: bool
    documents_discussed: List[str]
    session_id: str


# ============================================================================
# IN-MEMORY CONVERSATION STORE (Simple Implementation)
# ============================================================================

class SimpleConversationStore:
    """
    🆕 Lightweight in-memory conversation storage
    Stores conversation history per session for context-aware responses
    """
    def __init__(self):
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        self.max_history_per_session = 20  # Keep last 20 messages
    
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
        
        # Keep only recent messages
        if len(self.conversations[session_id]) > self.max_history_per_session:
            self.conversations[session_id] = self.conversations[session_id][-self.max_history_per_session:]
    
    def get_history(self, session_id: str, last_n: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        return self.conversations.get(session_id, [])[-last_n:]
    
    def clear_history(self, session_id: str):
        """Clear conversation history"""
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def get_summary(self, session_id: str) -> Dict[str, Any]:
        """Get conversation summary"""
        messages = self.conversations.get(session_id, [])
        if not messages:
            return {"message_count": 0, "exists": False}
        
        return {
            "message_count": len(messages),
            "exists": True,
            "first_message_time": messages[0]["timestamp"],
            "last_message_time": messages[-1]["timestamp"],
            "documents_discussed": list(set(m.get("document_id") for m in messages if m.get("document_id")))
        }

# Global conversation store
conversation_store = SimpleConversationStore()


# ============================================================================
# NEW HELPER FUNCTIONS (Added for Enhanced Chatbot RAG)
# ============================================================================

def _detect_question_type(question: str) -> str:
    """
    🆕 Detect the type of question to optimize retrieval strategy
    """
    question_lower = question.lower()
    
    # Factual/specific questions
    if any(word in question_lower for word in ['what is', 'define', 'explain', 'who', 'when', 'where']):
        return "factual"
    
    # Comparative questions
    if any(word in question_lower for word in ['compare', 'difference', 'better', 'versus', 'vs']):
        return "comparative"
    
    # Risk/concern questions
    if any(word in question_lower for word in ['risk', 'concern', 'problem', 'issue', 'danger', 'penalty']):
        return "risk_analysis"
    
    # Procedural questions
    if any(word in question_lower for word in ['how to', 'process', 'steps', 'procedure']):
        return "procedural"
    
    # Opinion/advice questions
    if any(word in question_lower for word in ['should', 'recommend', 'advice', 'suggest', 'opinion']):
        return "advisory"
    
    # Yes/No questions
    if any(question_lower.startswith(word) for word in ['is ', 'are ', 'does ', 'do ', 'can ', 'will ']):
        return "yes_no"
    
    return "general"


def _expand_query_for_retrieval(user_message: str, question_type: str) -> List[str]:
    """
    🆕 Expand user query into multiple search queries for better retrieval
    Uses question type to generate relevant variations
    """
    queries = [user_message]  # Always include original
    
    # Extract key legal terms
    legal_terms = re.findall(r'\b(?:termination|liability|indemnification|compensation|'
                             r'confidentiality|penalty|obligation|breach|clause|'
                             r'agreement|contract|rights|duties)\b', user_message.lower())
    
    if question_type == "risk_analysis":
        queries.append(f"risks penalties consequences {' '.join(legal_terms)}")
        queries.append(f"liability obligations breach {' '.join(legal_terms)}")
    
    elif question_type == "factual":
        if legal_terms:
            queries.append(f"definition explanation {' '.join(legal_terms)}")
    
    elif question_type == "comparative":
        queries.append(f"terms conditions provisions {' '.join(legal_terms)}")
    
    elif question_type == "yes_no":
        # Extract the main subject
        queries.append(" ".join(legal_terms) if legal_terms else user_message)
    
    return queries[:3]  # Limit to 3 queries max


async def _retrieve_contextual_chunks(
    document_id: str,
    user_message: str,
    question_type: str,
    top_k: int = 10
) -> Tuple[List[Dict[str, Any]], str]:
    """
    🆕 Enhanced chunk retrieval with query expansion and context formatting
    """
    try:
        # Generate multiple search queries
        search_queries = _expand_query_for_retrieval(user_message, question_type)
        
        all_chunks = []
        seen_chunk_ids = set()
        
        # Retrieve using multiple queries
        for i, query in enumerate(search_queries):
            try:
                chunks = await vector_service.retrieve_relevant_chunks(
                    query=query,
                    document_id=document_id,
                    top_k=top_k if i == 0 else max(5, top_k // 2)  # Fewer for secondary queries
                )
                
                for chunk in chunks:
                    chunk_id = chunk.get('id')
                    if chunk_id not in seen_chunk_ids:
                        chunk['query_source'] = 'primary' if i == 0 else f'expanded_{i}'
                        all_chunks.append(chunk)
                        seen_chunk_ids.add(chunk_id)
                
                logger.info(f"🔍 Query {i+1} '{query[:40]}...' retrieved {len(chunks)} chunks")
                
            except Exception as e:
                logger.warning(f"⚠️ Query {i+1} failed: {str(e)}")
                continue
        
        # Sort by relevance score
        all_chunks.sort(key=lambda x: x.get('score', 0.0), reverse=True)
        
        # Take top-k most relevant
        final_chunks = all_chunks[:top_k]
        
        # Format chunks with enhanced metadata
        formatted_context = _format_chunks_for_chatbot(final_chunks, question_type)
        
        logger.info(f"✅ Retrieved {len(final_chunks)} unique chunks from {len(search_queries)} queries")
        
        return final_chunks, formatted_context
        
    except Exception as e:
        logger.error(f"❌ Contextual retrieval failed: {str(e)}")
        return [], ""


def _format_chunks_for_chatbot(chunks: List[Dict[str, Any]], question_type: str) -> str:
    """
    🆕 Format retrieved chunks with metadata for optimal chatbot understanding
    """
    if not chunks:
        return ""
    
    formatted_sections = []
    
    for i, chunk in enumerate(chunks):
        chunk_text = chunk.get('text', '')
        chunk_index = chunk.get('chunk_index', i)
        relevance_score = chunk.get('score', 0.0)
        
        # Add relevance indicator
        if relevance_score > 0.7:
            relevance_tag = "🔥 HIGH RELEVANCE"
        elif relevance_score > 0.5:
            relevance_tag = "📌 RELEVANT"
        else:
            relevance_tag = "📄 CONTEXT"
        
        section = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{relevance_tag} | Section {chunk_index + 1} | Relevance: {relevance_score:.2f}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{chunk_text}
"""
        formatted_sections.append(section)
    
    return "\n".join(formatted_sections)


def _format_conversation_history(history: List[Dict[str, Any]]) -> str:
    """
    🆕 Format conversation history for LLM context
    """
    if not history:
        return ""
    
    formatted = ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
    formatted.append("📜 PREVIOUS CONVERSATION CONTEXT:")
    formatted.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    for msg in history[-6:]:  # Last 3 exchanges
        role = "USER" if msg['role'] == 'user' else "ASSISTANT"
        content = msg['content'][:300] + "..." if len(msg['content']) > 300 else msg['content']
        formatted.append(f"[{role}]: {content}\n")
    
    formatted.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    return "\n".join(formatted)


def _build_enhanced_system_prompt(
    has_document_context: bool,
    question_type: str,
    has_conversation_history: bool
) -> str:
    """
    🆕 Build dynamic system prompt based on context availability and question type
    """
    base_prompt = """You are Accord AI, an expert legal assistant specializing in contract analysis and legal document review.

Your core capabilities:
- Analyze and explain legal documents with precision
- Answer questions based on retrieved contract sections
- Provide clear, accurate legal information
- Cite specific sections when answering document-related questions
- Maintain conversation context for coherent multi-turn interactions

Critical guidelines:
- ALWAYS base your answers on the provided document sections when available
- CITE specific section numbers when referencing contract content
- If information is NOT in the provided sections, clearly state that
- Never fabricate legal information or contract terms
- Be professional, accurate, and concise
- Use clear language to explain complex legal concepts"""
    
    # Add context-specific instructions
    if has_document_context:
        base_prompt += """

📋 DOCUMENT CONTEXT IS PROVIDED:
- You have access to relevant sections from the user's uploaded contract
- Reference these sections EXPLICITLY when answering (e.g., "According to Section 3...")
- Quote specific contract language when relevant
- If the answer requires information not in the provided sections, say so clearly"""
    
    else:
        base_prompt += """

⚠️ NO DOCUMENT CONTEXT AVAILABLE:
- No specific document has been uploaded or the question is general
- Provide general legal knowledge and explanations
- Clarify that you're not referencing a specific contract
- Suggest uploading a document for specific analysis"""
    
    # Add conversation context note
    if has_conversation_history:
        base_prompt += """

💬 CONVERSATION HISTORY IS PROVIDED:
- Review the previous conversation to maintain context
- Reference earlier questions/answers when relevant
- Provide coherent responses that build on prior discussion"""
    
    # Add question-type specific guidance
    if question_type == "yes_no":
        base_prompt += """

❓ ANSWERING YES/NO QUESTION:
- Start with a clear YES or NO answer
- Then provide brief explanation with supporting details from the document"""
    
    elif question_type == "risk_analysis":
        base_prompt += """

⚠️ RISK ANALYSIS QUESTION:
- Identify specific risks mentioned in the contract sections
- Explain potential consequences
- Quote relevant clauses that create the risk"""
    
    elif question_type == "comparative":
        base_prompt += """

🔄 COMPARATIVE QUESTION:
- Compare the relevant aspects clearly
- Use specific examples from the document
- Present information in an organized manner"""
    
    return base_prompt


def _verify_response_quality(
    response: str,
    chunks: List[Dict[str, Any]],
    question: str
) -> Tuple[str, List[str]]:
    """
    🆕 Post-process response to add warnings if quality issues detected
    Returns: (potentially modified response, list of warnings)
    """
    warnings = []
    
    # Check if response is too short for substantial questions
    if len(question.split()) > 5 and len(response.split()) < 20:
        warnings.append("Response may be incomplete - consider asking for more detail")
    
    # Check if response claims information not in chunks (basic hallucination detection)
    if chunks and len(response) > 100:
        # Extract chunk text for comparison
        chunk_text_combined = " ".join([c.get('text', '') for c in chunks]).lower()
        
        # Check for suspicious specific numbers/dates in response that aren't in chunks
        response_numbers = re.findall(r'\$[\d,]+|\d+\s*(?:days|months|years)', response)
        if response_numbers:
            for num in response_numbers[:3]:  # Check first 3 numbers
                if num.lower() not in chunk_text_combined:
                    warnings.append("Response may contain details not present in the document - verify carefully")
                    break
    
    # Add warning footer if issues detected
    if warnings:
        response += f"\n\n⚠️ Note: {'; '.join(warnings)}"
    
    return response, warnings


# ============================================================================
# MAIN CHAT ENDPOINT (Name Preserved, Logic Enhanced)
# ============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    ✅ ENDPOINT NAME PRESERVED: /chat
    ✅ FUNCTION NAME PRESERVED: chat_endpoint
    🔧 LOGIC COMPLETELY REWRITTEN for enhanced conversational RAG
    """
    try:
        session_id = current_session["session_id"]
        logger.info(f"💬 Enhanced chat request from session {session_id[:8]}...")
        
        # 🆕 Step 1: Detect question type for optimized retrieval
        question_type = _detect_question_type(request.message)
        logger.info(f"🔍 Question type detected: {question_type}")
        
        # 🆕 Step 2: Retrieve conversation history for context
        conversation_history = conversation_store.get_history(session_id, last_n=10)
        has_history = len(conversation_history) > 0
        
        # 🆕 Step 3: Enhanced RAG retrieval (if document provided)
        relevant_chunks = []
        document_context = ""
        
        if request.use_rag and request.document_id:
            session_document_id = f"{session_id}_{request.document_id}"
            logger.info(f"🔍 Retrieving context for doc: {session_document_id}")
            
            try:
                # Use enhanced contextual retrieval
                relevant_chunks, document_context = await _retrieve_contextual_chunks(
                    document_id=session_document_id,
                    user_message=request.message,
                    question_type=question_type,
                    top_k=10  # Increased from 5 for better coverage
                )
                
                if relevant_chunks:
                    logger.info(f"✅ Retrieved {len(relevant_chunks)} relevant chunks")
                else:
                    logger.warning(f"⚠️ No relevant chunks found for {session_document_id}")
                    document_context = "⚠️ No relevant content found in the document for this question. The document may not contain information about this topic."
                    
            except Exception as e:
                logger.error(f"❌ Document retrieval failed: {str(e)}")
                document_context = "❌ Error retrieving document content. Please try again."
        
        # 🆕 Step 4: Build enhanced system prompt
        system_prompt = _build_enhanced_system_prompt(
            has_document_context=bool(document_context and relevant_chunks),
            question_type=question_type,
            has_conversation_history=has_history
        )
        
        # 🆕 Step 5: Construct comprehensive prompt with all context
        prompt_parts = []
        
        # Add system instructions
        prompt_parts.append(system_prompt)
        prompt_parts.append("\n\n")
        
        # Add conversation history if available
        if has_history:
            formatted_history = _format_conversation_history(conversation_history)
            prompt_parts.append(formatted_history)
            prompt_parts.append("\n\n")
        
        # Add document context if available
        if document_context:
            prompt_parts.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            prompt_parts.append("\n📄 RELEVANT DOCUMENT SECTIONS:\n")
            prompt_parts.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
            prompt_parts.append(document_context)
            prompt_parts.append("\n\n")
        
        # Add current question with clear instructions
        prompt_parts.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        prompt_parts.append("\n🎯 CURRENT USER QUESTION:\n")
        prompt_parts.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
        prompt_parts.append(f"{request.message}\n\n")
        
        # Add specific answering instructions based on context
        if document_context and relevant_chunks:
            prompt_parts.append("""
📋 ANSWERING INSTRUCTIONS:
1. Base your answer STRICTLY on the document sections provided above
2. Cite specific section numbers when referencing contract content
3. Quote relevant contract language when appropriate
4. If the answer is not in the provided sections, clearly state that
5. Do not make assumptions or add information not present in the document

Now, provide your answer:""")
        else:
            prompt_parts.append("""
💡 ANSWERING INSTRUCTIONS:
1. Provide a helpful answer based on general legal knowledge
2. Clarify that you're not referencing a specific uploaded document
3. Suggest uploading a document for specific contract analysis if relevant

Now, provide your answer:""")
        
        full_prompt = "".join(prompt_parts)
        
        # 🆕 Step 6: Call LLM with enhanced prompt
        try:
            logger.info(f"🤖 Calling LLM with enhanced prompt ({len(full_prompt)} chars)")
            
            # Use system message for better instruction following
            system_message = "You are Accord AI, a legal document analysis expert. Follow all instructions precisely."
            
            llm_response = await llm_service.call_groq(full_prompt, system_message)
            
            # 🆕 Handle response format (dict or string)
            if isinstance(llm_response, dict):
                # Try multiple keys where content might be
                final_answer = (
                    llm_response.get("content") or 
                    llm_response.get("response") or
                    llm_response.get("result") or
                    llm_response.get("text") or
                    str(llm_response)
                )
            else:
                final_answer = str(llm_response)
            
            # 🆕 Step 7: Verify response quality and add warnings if needed
            final_answer, quality_warnings = _verify_response_quality(
                response=final_answer,
                chunks=relevant_chunks,
                question=request.message
            )
            
            if quality_warnings:
                logger.warning(f"⚠️ Response quality warnings: {', '.join(quality_warnings)}")
            
        except Exception as e:
            logger.error(f"❌ LLM generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
        
        # 🆕 Step 8: Store conversation in history for future context
        conversation_store.add_message(
            session_id=session_id,
            role="user",
            content=request.message,
            document_id=request.document_id
        )
        
        conversation_store.add_message(
            session_id=session_id,
            role="assistant",
            content=final_answer,
            document_id=request.document_id
        )
        
        logger.info(f"✅ Chat response generated: {len(final_answer)} characters")
        
        # 🆕 Step 9: Return enhanced response with metadata
        return ChatResponse(
            response=final_answer,
            chunks_retrieved=len(relevant_chunks),
            relevant_sections=[
                {
                    "chunk_index": chunk.get("chunk_index", i),
                    "text_preview": chunk.get("text", "")[:200] + "..." if len(chunk.get("text", "")) > 200 else chunk.get("text", ""),
                    "relevance_score": chunk.get("score", 0.0),
                    "section_reference": f"Section {chunk.get('chunk_index', i) + 1}"
                }
                for i, chunk in enumerate(relevant_chunks)
            ],
            used_rag=bool(document_context and relevant_chunks),
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CONVERSATION HISTORY ENDPOINTS (Names Preserved, Enhanced)
# ============================================================================

@router.get("/conversation/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(current_session: dict = Depends(get_current_session)):
    """
    ✅ ENDPOINT NAME PRESERVED: /conversation/history
    ✅ FUNCTION NAME PRESERVED: get_conversation_history
    🔧 Now returns actual conversation history from store
    """
    session_id = current_session["session_id"]
    messages = conversation_store.get_history(session_id, last_n=50)
    
    return ConversationHistoryResponse(
        messages=messages,
        message_count=len(messages),
        session_id=session_id,
        timestamp=datetime.now().isoformat()
    )


@router.delete("/conversation/clear")
async def clear_conversation(current_session: dict = Depends(get_current_session)):
    """
    ✅ ENDPOINT NAME PRESERVED: /conversation/clear
    ✅ FUNCTION NAME PRESERVED: clear_conversation
    🔧 Now actually clears conversation history
    """
    session_id = current_session["session_id"]
    conversation_store.clear_history(session_id)
    
    logger.info(f"🗑️ Cleared conversation history for session {session_id[:8]}...")
    
    return {
        "message": "Conversation history cleared successfully",
        "session_id": session_id,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/conversation/summary", response_model=ConversationSummaryResponse)
async def get_conversation_summary(current_session: dict = Depends(get_current_session)):
    """
    ✅ ENDPOINT NAME PRESERVED: /conversation/summary
    ✅ FUNCTION NAME PRESERVED: get_conversation_summary
    🔧 Now returns actual conversation summary
    """
    session_id = current_session["session_id"]
    summary = conversation_store.get_summary(session_id)
    
    return ConversationSummaryResponse(
        message_count=summary.get("message_count", 0),
        exists=summary.get("exists", False),
        documents_discussed=summary.get("documents_discussed", []),
        session_id=session_id
    )


# ============================================================================
# UTILITY ENDPOINTS (Unchanged)
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "enhanced_chatbot",
        "version": "2.0",
        "features": [
            "Multi-query retrieval",
            "Question type detection",
            "Conversation history",
            "Enhanced context formatting",
            "Response quality verification"
        ]
    }


@router.get("/examples")
async def get_chatbot_examples():
    """Get example questions for the chatbot"""
    return {
        "examples": {
            "general_questions": [
                "What is a service bond?",
                "Explain liquidated damages in simple terms",
                "What are common risks in employment contracts?"
            ],
            "document_specific": [
                "What are the payment terms in this contract?",
                "Is there a non-compete clause?",
                "What are the termination conditions?",
                "What penalties are mentioned for early termination?",
                "Who owns the intellectual property created during employment?"
            ],
            "comparative": [
                "What's the difference between termination with cause and without cause?",
                "Compare the obligations of both parties"
            ],
            "risk_questions": [
                "What are the main risks in this contract?",
                "What penalties could I face?",
                "Are there any concerning clauses?"
            ]
        },
        "tips": [
            "Be specific in your questions for better answers",
            "Reference document sections if you know them",
            "Ask follow-up questions to drill deeper into topics",
            "Use 'explain in simple terms' for complex legal concepts"
        ]
    }


# Export the router (unchanged)
chatbot_router = router
