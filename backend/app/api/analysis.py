from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
import logging
from datetime import datetime

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

# Updated prompt templates for RAG
RAG_ANALYSIS_PROMPTS = {
    "risk_analysis": """
Based on the following contract excerpts, identify legal risks and issues:

RELEVANT CONTRACT SECTIONS:
{relevant_text}

ANALYSIS REQUEST:
Analyze these contract sections for potential risks. Focus on:
1. Top 3 risks with severity levels (High/Medium/Low)
2. Specific problematic clauses
3. Jurisdiction considerations: {jurisdiction}

Provide detailed analysis in JSON format:
{{
    "risks": [
        {{
            "title": "Risk name",
            "severity": "High|Medium|Low", 
            "emoji": "🔴|🟡|🟢",
            "description": "Clear explanation",
            "clause_reference": "Which section/clause",
            "recommendation": "What to do about it"
        }}
    ],
    "overall_risk_score": "1-10",
    "summary": "Brief overall assessment"
}}
""",

    "negotiation": """
Based on these contract sections, create negotiation recommendations:

RELEVANT CONTRACT SECTIONS:
{relevant_text}

Create negotiation strategy focusing on:
1. Key points to negotiate
2. Alternative clause suggestions
3. Email draft for counterparty

Format as JSON with email_draft, negotiation_points, and alternative_clauses.
""",

    "summary": """
Summarize these key contract sections:

RELEVANT CONTRACT SECTIONS:
{relevant_text}

Provide a comprehensive summary including:
1. Key terms and obligations
2. Important dates and deadlines
3. Financial terms
4. Risk factors

Format as structured JSON summary.
"""
}

@router.post("/rag_analysis", response_model=RAGAnalysisResponse)
async def rag_analysis(request: RAGAnalysisRequest):
    """
    Perform analysis using RAG - retrieve relevant chunks then analyze
    """
    try:
        # Step 1: Retrieve relevant chunks based on analysis type
        query_map = {
            "risk_analysis": "legal risks liability indemnification termination penalties",
            "negotiation": "payment terms obligations termination renewal liability",
            "summary": "key terms parties obligations payments duration"
        }
        
        query = query_map.get(request.analysis_type, "contract terms")
        
        # Retrieve relevant chunks
        relevant_chunks = await vector_service.retrieve_relevant_chunks(
            query=query,
            document_id=request.document_id,
            top_k=8  # Get more chunks for better context
        )
        
        if not relevant_chunks:
            raise HTTPException(status_code=404, detail="No relevant content found for this document")
        
        # Step 2: Combine relevant chunks
        relevant_text = "\n\n".join([
            f"SECTION {chunk['chunk_index']}: {chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Step 3: Create focused prompt with only relevant content
        prompt_template = RAG_ANALYSIS_PROMPTS.get(request.analysis_type, RAG_ANALYSIS_PROMPTS["risk_analysis"])
        prompt = prompt_template.format(
            relevant_text=relevant_text,
            jurisdiction=request.jurisdiction
        )
        
        # Step 4: Call LLM with focused context
        logger.info(f"Analyzing {len(relevant_chunks)} relevant chunks for {request.analysis_type}")
        
        # Use Groq API (from your config)
        analysis_result = await llm_service.call_groq(prompt)
        
        return RAGAnalysisResponse(
            analysis=analysis_result,
            relevant_chunks=[{
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"][:200] + "...",  # Preview only
                "relevance_score": chunk["score"]
            } for chunk in relevant_chunks],
            status="success",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"RAG analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
analysis_router = router
