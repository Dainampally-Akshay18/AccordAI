# analysis.py - Modular Endpoints for Each Analysis Type
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

class AnalysisRequest(BaseModel):
    document_id: str
    jurisdiction: str = "US"

class AnalysisResponse(BaseModel):
    analysis: dict
    relevant_chunks: list
    status: str
    timestamp: str
    session_id: str

# ✅ SPECIALIZED PROMPTS FOR EACH ENDPOINT
RISK_ANALYSIS_PROMPT = """
You are a senior legal risk analyst. Analyze the contract sections and identify ALL legal risks.

CONTRACT SECTIONS:
{relevant_text}

REQUIREMENTS:
- Find ALL risks (not just top 3)
- Categorize by severity: High, Medium, Low
- Provide specific recommendations
- Consider jurisdiction: {jurisdiction}

RESPOND WITH VALID JSON:
{{
    "risks": [
        {{
            "title": "Risk title",
            "severity": "High|Medium|Low",
            "emoji": "🔴|🟡|🟢",
            "description": "Clear risk explanation",
            "clause_reference": "Specific clause reference",
            "recommendation": "Mitigation action",
            "impact": "Potential consequences",
            "probability": "High|Medium|Low"
        }}
    ],
    "risk_metrics": {{
        "total_risks": 5,
        "high_risk_count": 2,
        "medium_risk_count": 2,
        "low_risk_count": 1,
        "overall_risk_score": 7.5,
        "risk_categories": ["Payment", "Liability", "Termination"]
    }},
    "summary": "Executive risk assessment"
}}"""

NEGOTIATION_PROMPT = """
You are a professional contract negotiation expert. Generate email templates for contract responses.

CONTRACT SECTIONS:
{relevant_text}

REQUIREMENTS:
- Create professional acceptance and rejection emails
- Include proper business formatting
- Consider jurisdiction: {jurisdiction}

RESPOND WITH VALID JSON:
{{
    "emails": {{
        "acceptance": "Subject: Contract Acceptance\\n\\nDear [Counterparty],\\n\\nThank you for the contract. After careful review, we accept the terms as presented.\\n\\nBest regards,\\n[Your Name]",
        "rejection": "Subject: Contract Modifications Required\\n\\nDear [Counterparty],\\n\\nWe've reviewed the contract and need modifications before proceeding.\\n\\nBest regards,\\n[Your Name]"
    }},
    "key_points": [
        {{
            "issue": "Payment terms",
            "concern": "Net 60 days too long", 
            "suggestion": "Net 30 days preferred"
        }}
    ]
}}"""

SUMMARY_PROMPT = """
You are a legal document analyst. Create a comprehensive contract summary.

CONTRACT SECTIONS:
{relevant_text}

REQUIREMENTS:
- Extract key terms and obligations
- Identify important dates
- Summarize financial terms
- Consider jurisdiction: {jurisdiction}

RESPOND WITH VALID JSON:
{{
    "overview": {{
        "contract_type": "Service Agreement",
        "parties": ["Company A", "Company B"],
        "effective_date": "2025-01-01",
        "term": "12 months"
    }},
    "key_terms": [
        {{
            "term": "Payment Schedule",
            "description": "Monthly payments due on 1st"
        }}
    ],
    "financial_terms": {{
        "total_value": "$100,000",
        "payment_frequency": "Monthly",
        "currency": "USD"
    }},
    "important_dates": [
        {{
            "date": "2025-01-15",
            "event": "Project kickoff",
            "importance": "High"
        }}
    ],
    "obligations": {{
        "party_a": ["Deliver services", "Maintain quality"],
        "party_b": ["Make payments", "Provide access"]
    }},
    "summary": "Contract overview in 2-3 sentences"
}}"""

# ✅ ENDPOINT 1: Risk Analysis
@router.post("/risk-analysis", response_model=AnalysisResponse)
async def analyze_risks(
    request: AnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """Dedicated endpoint for legal risk analysis with metrics"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"🎯 RISK ANALYSIS REQUEST for document: {request.document_id}")
        
        # Retrieve risk-focused chunks
        relevant_chunks = await vector_service.retrieve_relevant_chunks(
            query="legal risks liability penalties indemnification breach termination warranties",
            document_id=session_document_id,
            top_k=20
        )
        
        if not relevant_chunks:
            raise HTTPException(status_code=404, detail="No relevant content found for risk analysis")
        
        # Format content
        relevant_text = "\n\n".join([
            f"SECTION {chunk['chunk_index'] + 1}:\n{chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Generate analysis
        prompt = RISK_ANALYSIS_PROMPT.format(
            relevant_text=relevant_text,
            jurisdiction=request.jurisdiction
        )
        
        llm_response = await llm_service.call_groq(prompt)
        parsed_analysis = await _parse_response(llm_response, "risk")
        
        return AnalysisResponse(
            analysis=parsed_analysis,
            relevant_chunks=_format_chunks(relevant_chunks),
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"❌ Risk analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")

# ✅ ENDPOINT 2: Negotiation Assistant  
@router.post("/negotiation-assistant", response_model=AnalysisResponse)
async def negotiation_assistant(
    request: AnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """Dedicated endpoint for contract negotiation assistance"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"🤝 NEGOTIATION ASSISTANT REQUEST for document: {request.document_id}")
        
        # Retrieve negotiation-focused chunks
        relevant_chunks = await vector_service.retrieve_relevant_chunks(
            query="payment terms conditions obligations termination renewal liability negotiation",
            document_id=session_document_id,
            top_k=15
        )
        
        if not relevant_chunks:
            raise HTTPException(status_code=404, detail="No relevant content found for negotiation")
        
        # Format content
        relevant_text = "\n\n".join([
            f"SECTION {chunk['chunk_index'] + 1}:\n{chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Generate negotiation assistance
        prompt = NEGOTIATION_PROMPT.format(
            relevant_text=relevant_text,
            jurisdiction=request.jurisdiction
        )
        
        llm_response = await llm_service.call_groq(prompt)
        parsed_analysis = await _parse_response(llm_response, "negotiation")
        
        return AnalysisResponse(
            analysis=parsed_analysis,
            relevant_chunks=_format_chunks(relevant_chunks),
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"❌ Negotiation assistant failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Negotiation assistance failed: {str(e)}")

# ✅ ENDPOINT 3: Document Summary
@router.post("/document-summary", response_model=AnalysisResponse)
async def document_summary(
    request: AnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """Dedicated endpoint for document summarization"""
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"📄 DOCUMENT SUMMARY REQUEST for document: {request.document_id}")
        
        # Retrieve summary-focused chunks
        relevant_chunks = await vector_service.retrieve_relevant_chunks(
            query="key terms parties obligations payments duration financial terms deadlines",
            document_id=session_document_id,
            top_k=18
        )
        
        if not relevant_chunks:
            raise HTTPException(status_code=404, detail="No relevant content found for summary")
        
        # Format content
        relevant_text = "\n\n".join([
            f"SECTION {chunk['chunk_index'] + 1}:\n{chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Generate summary
        prompt = SUMMARY_PROMPT.format(
            relevant_text=relevant_text,
            jurisdiction=request.jurisdiction
        )
        
        llm_response = await llm_service.call_groq(prompt)
        parsed_analysis = await _parse_response(llm_response, "summary")
        
        return AnalysisResponse(
            analysis=parsed_analysis,
            relevant_chunks=_format_chunks(relevant_chunks),
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"❌ Document summary failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document summary failed: {str(e)}")

# Helper functions
async def _parse_response(llm_response: dict, analysis_type: str) -> dict:
    """Parse LLM response to structured JSON"""
    try:
        content = llm_response.get("result", llm_response) if isinstance(llm_response, dict) else str(llm_response)
        
        if isinstance(content, str):
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        
        return content if isinstance(content, dict) else {"error": "Invalid response format"}
        
    except Exception as e:
        logger.error(f"Response parsing failed: {str(e)}")
        return _create_fallback_response(str(llm_response), analysis_type)

def _create_fallback_response(content: str, analysis_type: str) -> dict:
    """Create fallback response structure"""
    fallbacks = {
        "risk": {
            "risks": [{"title": "Analysis Available", "severity": "Medium", "description": content[:200]}],
            "risk_metrics": {"total_risks": 1, "overall_risk_score": 5}
        },
        "negotiation": {
            "emails": {
                "acceptance": f"Contract acceptance email based on: {content[:100]}",
                "rejection": f"Contract modification request based on: {content[:100]}"
            }
        },
        "summary": {
            "overview": {"contract_type": "Document Analysis"},
            "summary": content[:200]
        }
    }
    return fallbacks.get(analysis_type, {"result": content})

def _format_chunks(chunks):
    """Format chunks for response"""
    return [{
        "chunk_index": chunk["chunk_index"],
        "text": chunk["text"][:300] + "..." if len(chunk["text"]) > 300 else chunk["text"],
        "relevance_score": chunk["score"]
    } for chunk in chunks]

analysis_router = router
