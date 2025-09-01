# analysis.py - Complete Enterprise-Grade Fix
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
from app.api.auth import get_current_session
import logging
from datetime import datetime
import json
import re

router = APIRouter()
logger = logging.getLogger(__name__)

class RAGAnalysisRequest(BaseModel):
    document_id: str
    analysis_type: str = "risk_analysis"
    jurisdiction: str = "US"

class RAGAnalysisResponse(BaseModel):
    analysis: dict
    relevant_chunks: list
    status: str
    timestamp: str
    session_id: str

# ✅ COMPLETELY REWRITTEN: Distinct, Structured Prompts for Each Analysis Type
RAG_ANALYSIS_PROMPTS = {
    "risk_analysis": """
You are a senior legal analyst. Analyze the provided contract sections and identify ALL legal risks.

CONTRACT SECTIONS:
{relevant_text}

ANALYSIS REQUIREMENTS:
- Find ALL risks (not just top 3)
- Categorize each risk by severity: High, Medium, Low
- Provide specific recommendations for each risk
- Consider jurisdiction: {jurisdiction}

RESPOND ONLY WITH VALID JSON:
{{
    "risks": [
        {{
            "title": "Risk title",
            "severity": "High",
            "emoji": "🔴",
            "description": "Clear explanation of the risk",
            "clause_reference": "Reference to specific clause",
            "recommendation": "Specific action to mitigate risk",
            "impact": "Potential consequences if not addressed"
        }},
        {{
            "title": "Another risk",
            "severity": "Medium", 
            "emoji": "🟡",
            "description": "Another risk explanation",
            "clause_reference": "Another clause reference",
            "recommendation": "Another recommendation",
            "impact": "Another impact description"
        }}
    ],
    "overall_risk_score": 7,
    "summary": "Overall assessment of contract risks",
    "total_risks_found": 5,
    "high_risks": 2,
    "medium_risks": 2,
    "low_risks": 1
}}""",

    "negotiation": """
You are a senior contract negotiation expert. Create a comprehensive negotiation strategy.

CONTRACT SECTIONS:
{relevant_text}

NEGOTIATION REQUIREMENTS:
- Identify key negotiation points
- Suggest alternative clauses
- Generate TWO email templates: one for ACCEPTANCE and one for REJECTION
- Consider jurisdiction: {jurisdiction}

RESPOND ONLY WITH VALID JSON:
{{
    "key_negotiation_points": [
        {{
            "point": "Payment terms",
            "current_issue": "Net 60 days is too long",
            "suggested_change": "Negotiate to Net 30 days",
            "priority": "High"
        }}
    ],
    "alternative_clauses": [
        {{
            "clause_type": "Payment Terms",
            "original": "Payment due in 60 days",
            "suggested": "Payment due in 30 days with 2% early payment discount"
        }}
    ],
    "emails": {{
        "acceptance": "Subject: Contract Acceptance - [Contract Name]\\n\\nDear [Counterparty],\\n\\nThank you for providing the contract. After careful review, we are pleased to accept the terms as proposed...\\n\\nBest regards,\\n[Your Name]",
        "rejection": "Subject: Contract Review - Proposed Modifications\\n\\nDear [Counterparty],\\n\\nThank you for the contract proposal. After thorough review, we have identified several areas requiring modification before we can proceed...\\n\\nWe look forward to your response.\\n\\nBest regards,\\n[Your Name]"
    }},
    "negotiation_strategy": "Overall strategy for approaching negotiations",
    "priority_issues": ["Issue 1", "Issue 2", "Issue 3"]
}}""",

    "summary": """
You are a senior legal document analyst. Create a comprehensive document summary.

CONTRACT SECTIONS:
{relevant_text}

SUMMARY REQUIREMENTS:
- Extract key terms and obligations
- Identify important dates and deadlines
- Summarize financial terms
- Highlight critical clauses
- Consider jurisdiction: {jurisdiction}

RESPOND ONLY WITH VALID JSON:
{{
    "document_overview": {{
        "contract_type": "Type of contract",
        "parties": ["Party 1", "Party 2"],
        "effective_date": "Contract start date",
        "expiration_date": "Contract end date",
        "jurisdiction": "{jurisdiction}"
    }},
    "key_terms": [
        {{
            "term": "Service delivery",
            "description": "Description of what services will be provided"
        }}
    ],
    "important_dates": [
        {{
            "date": "2025-01-15",
            "description": "Project milestone deadline",
            "importance": "High"
        }}
    ],
    "financial_terms": {{
        "total_value": "Contract total value",
        "payment_schedule": "How payments are structured",
        "penalties": "Late payment or breach penalties",
        "currency": "USD"
    }},
    "obligations": {{
        "party_a": ["Obligation 1", "Obligation 2"],
        "party_b": ["Obligation 1", "Obligation 2"]
    }},
    "termination_clauses": [
        "How contract can be terminated"
    ],
    "risk_factors": [
        "Key risk factor 1",
        "Key risk factor 2"
    ],
    "summary": "Overall summary of the contract in 2-3 sentences"
}}"""
}

@router.post("/rag_analysis", response_model=RAGAnalysisResponse)
async def rag_analysis(
    request: RAGAnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    Enhanced RAG analysis with structured JSON responses for each analysis type
    """
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"🎯 RAG ANALYSIS REQUEST:")
        logger.info(f"   Session ID: {session_id}")
        logger.info(f"   Document ID: {request.document_id}")
        logger.info(f"   Analysis Type: {request.analysis_type}")
        
        # Step 1: Verify document exists
        doc_info = await vector_service.get_document_info(session_document_id)
        if not doc_info.get("exists", False):
            logger.error(f"❌ Document not found: {session_document_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Document not found. Please upload the document first."
            )
        
        # Step 2: Retrieve relevant chunks with enhanced query
        query_map = {
            "risk_analysis": "legal risks liability penalties indemnification breach termination warranties obligations",
            "negotiation": "payment terms conditions obligations termination renewal liability negotiation clauses",
            "summary": "key terms parties obligations payments duration financial terms deadlines"
        }
        
        query = query_map.get(request.analysis_type, "contract terms conditions")
        logger.info(f"   Search Query: '{query}'")
        
        relevant_chunks = await vector_service.retrieve_relevant_chunks(
            query=query,
            document_id=session_document_id,
            top_k=20  # ✅ INCREASED: Get more chunks for comprehensive analysis
        )
        
        if not relevant_chunks:
            logger.error(f"❌ No relevant chunks found")
            raise HTTPException(
                status_code=404,
                detail=f"No relevant content found for {request.analysis_type} analysis."
            )
        
        logger.info(f"📊 Retrieved {len(relevant_chunks)} chunks")
        
        # Step 3: Combine relevant chunks with better formatting
        relevant_text = "\n\n".join([
            f"SECTION {chunk['chunk_index'] + 1}:\n{chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Step 4: Get the specific prompt template
        prompt_template = RAG_ANALYSIS_PROMPTS.get(request.analysis_type)
        if not prompt_template:
            logger.error(f"❌ Invalid analysis type: {request.analysis_type}")
            raise HTTPException(status_code=400, detail="Invalid analysis type")
        
        # Step 5: Format the prompt
        prompt = prompt_template.format(
            relevant_text=relevant_text,
            jurisdiction=request.jurisdiction
        )
        
        logger.info(f"🤖 Calling LLM for {request.analysis_type} analysis")
        
        # Step 6: Call LLM with enhanced error handling
        try:
            llm_response = await llm_service.call_groq(prompt)
        except Exception as llm_error:
            logger.error(f"❌ LLM service failed: {str(llm_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"AI analysis service failed: {str(llm_error)}"
            )
        
        # Step 7: Parse and validate JSON response
        parsed_analysis = await _parse_and_validate_response(llm_response, request.analysis_type)
        
        logger.info(f"✅ Analysis completed successfully for {request.analysis_type}")
        
        # Step 8: Return structured response
        return RAGAnalysisResponse(
            analysis=parsed_analysis,
            relevant_chunks=[{
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"][:300] + "..." if len(chunk["text"]) > 300 else chunk["text"],
                "relevance_score": chunk["score"]
            } for chunk in relevant_chunks],
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ RAG analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def _parse_and_validate_response(llm_response: dict, analysis_type: str) -> dict:
    """
    Parse and validate LLM response to ensure it's properly structured JSON
    """
    try:
        # Handle different response formats
        if isinstance(llm_response, dict):
            if "result" in llm_response:
                content = llm_response["result"]
            elif "analysis" in llm_response:
                content = llm_response["analysis"]
            else:
                content = llm_response
        elif isinstance(llm_response, str):
            content = llm_response
        else:
            content = str(llm_response)
        
        # Extract JSON from string if needed
        if isinstance(content, str):
            # Try to find JSON within the response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group()
            else:
                json_str = content
            
            try:
                parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                # If JSON parsing fails, create structured response
                logger.warning("⚠️ Failed to parse JSON, creating structured response")
                parsed_json = _create_fallback_response(content, analysis_type)
        else:
            parsed_json = content
        
        # Validate required fields based on analysis type
        validated_response = _validate_analysis_structure(parsed_json, analysis_type)
        
        return validated_response
        
    except Exception as e:
        logger.error(f"❌ Response parsing failed: {str(e)}")
        return _create_fallback_response(str(llm_response), analysis_type)

def _validate_analysis_structure(data: dict, analysis_type: str) -> dict:
    """
    Validate that the response has the expected structure for each analysis type
    """
    if analysis_type == "risk_analysis":
        if "risks" not in data:
            data["risks"] = []
        if "overall_risk_score" not in data:
            data["overall_risk_score"] = 5
        if "summary" not in data:
            data["summary"] = "Risk analysis completed"
            
    elif analysis_type == "negotiation":
        if "key_negotiation_points" not in data:
            data["key_negotiation_points"] = []
        if "emails" not in data:
            data["emails"] = {
                "acceptance": "Acceptance email template would be generated here.",
                "rejection": "Rejection email template would be generated here."
            }
        if "alternative_clauses" not in data:
            data["alternative_clauses"] = []
            
    elif analysis_type == "summary":
        if "document_overview" not in data:
            data["document_overview"] = {}
        if "key_terms" not in data:
            data["key_terms"] = []
        if "financial_terms" not in data:
            data["financial_terms"] = {}
    
    return data

def _create_fallback_response(content: str, analysis_type: str) -> dict:
    """
    Create a fallback structured response when JSON parsing fails
    """
    if analysis_type == "risk_analysis":
        return {
            "risks": [{
                "title": "Analysis Result",
                "severity": "Medium",
                "emoji": "⚠️",
                "description": content[:500],
                "clause_reference": "See document sections",
                "recommendation": "Please review the analysis details"
            }],
            "overall_risk_score": 5,
            "summary": "Risk analysis completed with text response"
        }
    elif analysis_type == "negotiation":
        return {
            "key_negotiation_points": [{"point": "Review required", "priority": "High"}],
            "emails": {
                "acceptance": "Subject: Contract Acceptance\n\n" + content[:200],
                "rejection": "Subject: Contract Modifications Required\n\n" + content[:200]
            },
            "negotiation_strategy": content[:300]
        }
    else:  # summary
        return {
            "document_overview": {"contract_type": "Document Summary"},
            "key_terms": [{"term": "Summary", "description": content[:300]}],
            "summary": content[:200]
        }

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for RAG analysis service"""
    try:
        llm_health = await llm_service.health_check_groq()
        vector_health = await vector_service.health_check()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "llm_service": llm_health,
                "vector_service": vector_health
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

analysis_router = router
