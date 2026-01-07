# app/api/analysis.py
# ✨ PHASE 2A: Enhanced RAG with Advanced Prompting & Context Management
# ✅ NO BREAKING CHANGES: All route names and function signatures preserved

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
from app.api.auth import get_current_session
import logging
from datetime import datetime
import json
import re
from typing import List, Dict, Any, Tuple

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================================
# MODELS (UNCHANGED - Preserved for API Compatibility)
# ============================================================================

class AnalysisRequest(BaseModel):
    document_id: str
    jurisdiction: str = "US"

class AnalysisResponse(BaseModel):
    analysis: dict
    relevant_chunks: list
    status: str
    timestamp: str
    session_id: str


# ============================================================================
# NEW HELPER FUNCTIONS (Added for Enhanced RAG)
# ============================================================================

def _format_chunk_with_metadata(chunk: Dict[str, Any], index: int) -> str:
    """
    🆕 Format chunks with metadata for better LLM context understanding
    Includes: section markers, relevance scores, and structural context
    """
    chunk_text = chunk.get('text', '')
    chunk_index = chunk.get('chunk_index', index)
    relevance_score = chunk.get('score', 0.0)
    section_type = chunk.get('section_type', 'standard')
    
    # Add relevance indicator for LLM awareness
    relevance_label = "HIGH RELEVANCE" if relevance_score > 0.7 else "MODERATE RELEVANCE" if relevance_score > 0.5 else "CONTEXT"
    
    formatted = f"""
═══════════════════════════════════════════════════════════════
📋 SECTION {chunk_index + 1} [{relevance_label}] (Score: {relevance_score:.2f})
───────────────────────────────────────────────────────────────
{chunk_text}
═══════════════════════════════════════════════════════════════
"""
    return formatted


async def _retrieve_multi_query_chunks(
    document_id: str, 
    primary_query: str, 
    secondary_queries: List[str], 
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    🆕 Multi-query retrieval strategy for comprehensive coverage
    Retrieves chunks using multiple related queries and deduplicates
    """
    all_chunks = []
    seen_chunk_ids = set()
    
    # Primary query (most relevant)
    try:
        primary_chunks = await vector_service.retrieve_relevant_chunks(
            query=primary_query,
            document_id=document_id,
            top_k=top_k
        )
        for chunk in primary_chunks:
            chunk_id = chunk.get('id')
            if chunk_id not in seen_chunk_ids:
                chunk['query_type'] = 'primary'
                all_chunks.append(chunk)
                seen_chunk_ids.add(chunk_id)
        
        logger.info(f"🔍 Primary query retrieved {len(primary_chunks)} chunks")
    except Exception as e:
        logger.warning(f"⚠️ Primary query failed: {str(e)}")
    
    # Secondary queries (additional context)
    for i, secondary_query in enumerate(secondary_queries):
        try:
            secondary_chunks = await vector_service.retrieve_relevant_chunks(
                query=secondary_query,
                document_id=document_id,
                top_k=max(1, top_k // 2)  # Fewer chunks per secondary query
            )
            for chunk in secondary_chunks:
                chunk_id = chunk.get('id')
                if chunk_id not in seen_chunk_ids:
                    chunk['query_type'] = f'secondary_{i+1}'
                    all_chunks.append(chunk)
                    seen_chunk_ids.add(chunk_id)
            
            logger.info(f"🔍 Secondary query {i+1} retrieved {len([c for c in secondary_chunks if c.get('id') not in seen_chunk_ids])} new chunks")
        except Exception as e:
            logger.warning(f"⚠️ Secondary query {i+1} failed: {str(e)}")
    
    # Sort by relevance score (primary queries naturally score higher)
    all_chunks.sort(key=lambda x: x.get('score', 0.0), reverse=True)
    
    logger.info(f"✅ Total unique chunks retrieved: {len(all_chunks)}")
    return all_chunks[:top_k]  # Return top-k most relevant


def _validate_and_repair_json(llm_response: Any) -> Dict[str, Any]:
    """
    🆕 Validate and attempt to repair malformed JSON responses
    Handles common LLM JSON formatting errors
    """
    if isinstance(llm_response, dict):
        return llm_response
    
    if isinstance(llm_response, str):
        # Try direct parsing
        try:
            return json.loads(llm_response)
        except json.JSONDecodeError:
            pass
        
        # Try extracting JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', llm_response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Try extracting any JSON object
        json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
    
    # Return error structure if all parsing fails
    logger.error(f"❌ Failed to parse LLM response: {str(llm_response)[:200]}")
    return {"error": "Failed to parse LLM response", "raw_response": str(llm_response)[:500]}


def _verify_analysis_quality(analysis: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
    """
    🆕 Post-processing validation to ensure analysis quality
    Adds warnings for incomplete or suspicious outputs
    """
    quality_issues = []
    
    if analysis_type == "risk":
        # Check for minimum risk identification
        risks = analysis.get('risks', [])
        if len(risks) < 2:
            quality_issues.append("Limited risk identification - may need manual review")
        
        # Check for risk score consistency
        total_risks = analysis.get('total_risks', 0)
        if len(risks) != total_risks:
            analysis['total_risks'] = len(risks)
            quality_issues.append("Risk count auto-corrected")
        
        # Verify each risk has required fields
        for risk in risks:
            if not risk.get('title') or not risk.get('description'):
                quality_issues.append("Some risks missing details")
                break
    
    elif analysis_type == "summary":
        # Check for minimum summary length
        summary = analysis.get('summary', '')
        if len(summary) < 200:
            quality_issues.append("Summary appears brief - consider requesting more detail")
        
        # Check for key sections
        if not analysis.get('key_points') or len(analysis.get('key_points', [])) < 3:
            quality_issues.append("Limited key points identified")
    
    elif analysis_type == "negotiation":
        # Check for email completeness
        emails = analysis.get('emails', {})
        if not emails.get('acceptance') or not emails.get('rejection'):
            quality_issues.append("Email templates incomplete")
    
    # Add quality metadata
    if quality_issues:
        analysis['_quality_warnings'] = quality_issues
        logger.warning(f"⚠️ Analysis quality issues: {', '.join(quality_issues)}")
    
    return analysis


# ============================================================================
# ENHANCED PROMPTS (Completely Rewritten with RAG Best Practices)
# ============================================================================

ENHANCED_RISK_PROMPT = """You are a senior legal risk analyst with 15+ years of experience in contract review and risk assessment.

Your task is to perform a comprehensive legal risk analysis of the contract sections provided below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRACT SECTIONS TO ANALYZE (Ranked by Relevance):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{formatted_chunks}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ANALYSIS FRAMEWORK - Follow This Step-by-Step Process:

STEP 1: SYSTEMATIC REVIEW
- Read through ALL provided sections carefully and completely
- Pay special attention to HIGH RELEVANCE sections
- Identify specific clauses, terms, and obligations that may pose legal or financial risks

STEP 2: RISK IDENTIFICATION (Focus on These Categories)
⚠️ Financial Risks: Payment obligations, penalties, liquidated damages, service bonds, refund conditions
⚖️ Legal Liability: Indemnification clauses, liability caps, force majeure, breach consequences
🔒 Compliance & Regulatory: Confidentiality requirements, data protection, regulatory compliance obligations
📅 Termination & Duration: Notice periods, early termination penalties, post-termination obligations
💼 Intellectual Property: IP ownership, licensing restrictions, work product assignment
🤝 Performance Obligations: Service level agreements, deliverable standards, quality metrics
🏛️ Dispute Resolution: Jurisdiction clauses, arbitration requirements, litigation costs

STEP 3: RISK ASSESSMENT
For each identified risk:
- Quote the SPECIFIC contract language that creates the risk (cite section number if visible)
- Assess severity: High (significant financial/legal impact), Medium (moderate concern), Low (minor issue)
- Explain WHY this constitutes a risk and what could go wrong
- Consider both immediate and long-term implications

STEP 4: RISK SCORING
- Calculate total_risks (count of all identified risks)
- Calculate risk_score (0-10 scale):
  * 0-3: Low overall risk
  * 4-6: Moderate overall risk
  * 7-8: High overall risk
  * 9-10: Critical overall risk
- Consider: number of risks, severity distribution, cumulative impact

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CRITICAL REQUIREMENTS:

1. Base your analysis ONLY on the contract sections provided above
2. Quote specific contract language when identifying risks
3. Cite section numbers when referencing specific clauses
4. Identify AT LEAST 3-5 risks for any substantive contract
5. Provide detailed explanations (50-100 words per risk)
6. Ensure severity ratings reflect actual potential impact

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 REQUIRED JSON OUTPUT FORMAT (No additional text before or after):

{{
  "risks": [
    {{
      "title": "Clear, specific risk title (e.g., 'Unlimited Liability for Data Breaches')",
      "severity": "High|Medium|Low",
      "description": "Detailed explanation citing specific contract language. Quote relevant text. Explain potential consequences and why this is concerning. Reference section number if available.",
      "section_reference": "Section number or 'Section X' if identifiable"
    }}
  ],
  "total_risks": <number>,
  "risk_score": <0-10 float>,
  "overall_assessment": "Brief 2-3 sentence summary of overall risk profile"
}}

🚨 SELF-CHECK BEFORE RESPONDING:
- Have I identified at least 3 distinct risks?
- Does each risk cite specific contract language?
- Are my severity ratings justified?
- Is my risk_score consistent with identified risks?
- Is my JSON properly formatted?

Now, analyze the contract and provide your risk assessment:"""


ENHANCED_NEGOTIATION_PROMPT = """You are an expert contract negotiation advisor with deep experience in employment law, commercial agreements, and business negotiations.

Your task is to analyze the contract sections below and draft TWO professional email templates for different negotiation scenarios.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRACT SECTIONS FOR ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{formatted_chunks}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 EMAIL DRAFTING FRAMEWORK:

SCENARIO 1: ACCEPTANCE EMAIL (Contract is favorable or acceptable with minor concerns)
✅ Tone: Professional, positive, appreciative
✅ Structure:
   - Express gratitude and acceptance
   - Confirm key positive terms (compensation, benefits, start date, etc.)
   - Briefly mention any minor clarifications needed
   - Express enthusiasm about the opportunity
   - Professional closing with next steps

SCENARIO 2: REJECTION/NEGOTIATION EMAIL (Contract has significant concerns)
⚠️ Tone: Professional, diplomatic, constructive
⚠️ Structure:
   - Thank them for the offer and express continued interest
   - Identify 2-4 specific terms requiring revision (cite contract sections)
   - Propose reasonable alternatives or request clarifications
   - Maintain positive tone about potential collaboration
   - Request meeting or call to discuss modifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 EMAIL REQUIREMENTS:

For BOTH emails:
- Include subject line
- Proper business email format
- Reference specific contract terms or sections from the provided content
- Be concise (200-300 words per email)
- Use professional but approachable language
- Include appropriate sign-off

For ACCEPTANCE email:
- Highlight 2-3 positive aspects of the contract
- Confirm your acceptance clearly
- Mention next steps or timeline

For REJECTION/NEGOTIATION email:
- Identify specific terms to revise (quote section numbers if visible)
- Propose alternatives or request clarifications
- Keep door open for continued discussion
- Avoid accusatory or negative language

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 REQUIRED JSON OUTPUT FORMAT:

{{
  "emails": {{
    "acceptance": "Subject: [Subject Line]\\n\\nDear [Recipient],\\n\\n[Full email body with multiple paragraphs]\\n\\nBest regards,\\n[Your Name]",
    "rejection": "Subject: [Subject Line]\\n\\nDear [Recipient],\\n\\n[Full email body with multiple paragraphs addressing concerns]\\n\\nBest regards,\\n[Your Name]"
  }},
  "key_terms_addressed": ["List of 3-5 specific contract terms referenced in emails"],
  "negotiation_priority": "Brief note on which terms should be prioritized in negotiation"
}}

Now, draft the two email templates based on the contract content provided:"""


ENHANCED_SUMMARY_PROMPT = """You are an expert legal document analyst specializing in contract review and comprehensive legal summaries.

Your task is to create a thorough, structured analysis of the contract sections provided below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRACT SECTIONS TO ANALYZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{formatted_chunks}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ANALYSIS FRAMEWORK - Complete Each Section:

1️⃣ CONTRACT IDENTIFICATION
- Determine the type/category of agreement (e.g., Employment Contract, Service Agreement, NDA, etc.)
- Identify the parties involved and their relationship
- Note the jurisdiction if mentioned

2️⃣ COMPREHENSIVE SUMMARY (4-6 detailed paragraphs covering):
   Paragraph 1: Nature and purpose of the agreement, parties involved
   Paragraph 2: Key obligations and responsibilities of each party
   Paragraph 3: Financial terms including compensation, payment schedules, penalties
   Paragraph 4: Duration, termination conditions, and notice requirements
   Paragraph 5: Special provisions, restrictions, or unique terms
   Paragraph 6: Risk factors and important considerations

3️⃣ KEY POINTS EXTRACTION
- Identify 5-7 most important terms or provisions
- Focus on actionable items and critical obligations
- Include both rights and restrictions

4️⃣ FINANCIAL DETAILS ANALYSIS
- Compensation structure and amounts
- Payment terms and schedules
- Penalties, liquidated damages, or service bonds
- Reimbursements or expense provisions
- Any other monetary obligations

5️⃣ TIMELINE & MILESTONES
- Contract start date / execution date
- Contract end date / duration
- Key milestones or performance deadlines
- Notice periods for various actions
- Renewal or extension terms

6️⃣ OBLIGATIONS MAPPING
- Primary party's obligations and duties
- Secondary party's obligations and duties
- Mutual obligations (confidentiality, cooperation, etc.)
- Performance standards or SLAs

7️⃣ RISKS & PENALTIES
- Potential legal or financial risks
- Penalty clauses and consequences
- Breach conditions and remedies

8️⃣ SPECIAL PROVISIONS
- Unusual or noteworthy clauses
- Restrictive covenants (non-compete, non-solicitation)
- Intellectual property terms
- Dispute resolution mechanisms
- Any other distinctive terms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ANALYSIS REQUIREMENTS:

1. Base ALL information on the provided contract sections
2. Quote specific terms when referencing obligations or conditions
3. Be specific with dates, amounts, and timeframes (if mentioned)
4. Identify parties by role if names aren't clear (e.g., "Employer", "Service Provider")
5. Create a comprehensive summary (minimum 400 words combined)
6. Extract at least 5 key points
7. Note if certain information is not present in the provided sections

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 REQUIRED JSON OUTPUT FORMAT:

{{
  "contract_type": "Specific type of agreement",
  "parties": {{
    "primary_party": "Name or role (e.g., Employer, Company A)",
    "secondary_party": "Name or role (e.g., Employee, Contractor)",
    "relationship": "Nature of relationship (e.g., employer-employee, client-vendor)"
  }},
  "summary": "Comprehensive 4-6 paragraph analysis covering all aspects mentioned in framework above. Each paragraph should be 60-100 words.",
  "key_points": [
    "Key point 1 with specific details",
    "Key point 2 with specific details",
    "Key point 3 with specific details",
    "Key point 4 with specific details",
    "Key point 5 with specific details"
  ],
  "financial_details": {{
    "compensation": "Detailed compensation structure (quote specific amounts if mentioned)",
    "penalties": "Penalty clauses and amounts (quote specific terms)",
    "payment_terms": "Payment schedule and conditions"
  }},
  "timeline": {{
    "start_date": "Start date if mentioned, otherwise 'Not specified'",
    "end_date": "End date or duration if mentioned",
    "key_milestones": "Important dates or milestones",
    "notice_periods": "Notice requirements for various actions"
  }},
  "obligations": {{
    "party_1_obligations": "Detailed list of primary party's duties and responsibilities",
    "party_2_obligations": "Detailed list of secondary party's duties and responsibilities",
    "mutual_obligations": "Shared obligations (confidentiality, cooperation, etc.)"
  }},
  "risks_and_penalties": [
    "Risk or penalty 1 with details",
    "Risk or penalty 2 with details",
    "Risk or penalty 3 with details"
  ],
  "special_provisions": [
    "Special provision 1 (non-compete, IP rights, etc.)",
    "Special provision 2",
    "Special provision 3"
  ],
  "missing_information": ["List any critical information not found in provided sections"]
}}

🚨 SELF-CHECK BEFORE RESPONDING:
- Is my summary at least 400 words and well-structured?
- Have I extracted at least 5 specific key points?
- Are financial details quoted from the contract?
- Have I identified obligations for both parties?
- Is my JSON properly formatted?

Now, provide your comprehensive contract analysis:"""


# ============================================================================
# ENHANCED HELPER FUNCTION (Existing Name, Completely Rewritten Logic)
# ============================================================================

async def get_enhanced_comprehensive_chunks(
    document_id: str, 
    analysis_type: str
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    ✅ EXISTING FUNCTION NAME PRESERVED
    🔧 LOGIC COMPLETELY REWRITTEN for multi-query retrieval and enhanced context
    
    Retrieves relevant chunks using multiple query strategies and formats
    them with metadata for optimal LLM understanding.
    """
    try:
        logger.info(f"🔍 Enhanced retrieval for {analysis_type} on doc: {document_id}")
        
        # 🆕 Multi-query strategy based on analysis type
        query_strategies = {
            "risk": {
                "primary": "legal risks liabilities penalties damages breach termination obligations compliance",
                "secondary": [
                    "financial penalties service bond liquidated damages indemnification",
                    "termination notice period consequences breach conditions",
                    "confidentiality data protection regulatory compliance requirements"
                ]
            },
            "negotiation": {
                "primary": "compensation salary benefits payment terms obligations duties responsibilities",
                "secondary": [
                    "termination notice period severance conditions",
                    "intellectual property rights ownership work product",
                    "non-compete non-solicitation restrictive covenants"
                ]
            },
            "summary": {
                "primary": "agreement contract terms parties obligations duties responsibilities scope purpose",
                "secondary": [
                    "compensation payment financial terms amounts schedule",
                    "duration term timeline start date end date milestones",
                    "termination conditions notice requirements"
                ]
            }
        }
        
        strategy = query_strategies.get(analysis_type, {
            "primary": "contract agreement terms conditions",
            "secondary": ["obligations responsibilities", "terms conditions"]
        })
        
        # 🆕 Multi-query retrieval
        chunks = await _retrieve_multi_query_chunks(
            document_id=document_id,
            primary_query=strategy["primary"],
            secondary_queries=strategy.get("secondary", []),
            top_k=20  # Increased from 15 for better coverage
        )
        
        if not chunks:
            logger.warning(f"⚠️ No chunks retrieved for {document_id}")
            return "", []
        
        logger.info(f"✅ Retrieved {len(chunks)} chunks for {analysis_type} analysis")
        
        # 🆕 Format chunks with metadata for better LLM understanding
        formatted_chunks = "\n\n".join([
            _format_chunk_with_metadata(chunk, i) 
            for i, chunk in enumerate(chunks)
        ])
        
        return formatted_chunks, chunks
        
    except Exception as e:
        logger.error(f"❌ Enhanced chunk retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")


# ============================================================================
# API ENDPOINTS (Names Preserved, Logic Enhanced)
# ============================================================================

@router.post("/risk-analysis", response_model=AnalysisResponse)
async def analyze_risks(
    request: AnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    ✅ ENDPOINT NAME PRESERVED: /risk-analysis
    ✅ FUNCTION NAME PRESERVED: analyze_risks
    🔧 LOGIC COMPLETELY REWRITTEN for enhanced accuracy
    """
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"🎯 Starting Enhanced Risk Analysis for: {session_document_id}")
        
        # 🔧 Use enhanced retrieval (same function name, new logic)
        formatted_chunks, chunks = await get_enhanced_comprehensive_chunks(
            session_document_id, 
            "risk"
        )
        
        if not formatted_chunks.strip():
            raise HTTPException(
                status_code=404, 
                detail="Document content not found. Please re-upload the file."
            )
        
        # 🆕 Use enhanced prompt with formatted chunks
        prompt = ENHANCED_RISK_PROMPT.format(formatted_chunks=formatted_chunks)
        
        # 🆕 Add system message for JSON enforcement
        system_message = """You are a legal risk analyst. You MUST respond with valid JSON only. 
No explanations before or after the JSON. Follow the exact format specified in the prompt."""
        
        # Call LLM with enhanced prompt
        llm_response = await llm_service.call_groq(prompt, system_message)
        
        # 🆕 Validate and repair JSON response
        analysis_result = _validate_and_repair_json(llm_response)
        
        # 🆕 Check for errors in response
        if "error" in analysis_result and "risks" not in analysis_result:
            # Use fallback if available
            analysis_result = llm_response.get("fallback_analysis", analysis_result)
        
        # 🆕 Post-processing validation
        analysis_result = _verify_analysis_quality(analysis_result, "risk")
        
        logger.info(f"✅ Risk analysis completed: {analysis_result.get('total_risks', 0)} risks identified")
        
        return AnalysisResponse(
            analysis=analysis_result,
            relevant_chunks=chunks,
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Risk analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/negotiation-assistant", response_model=AnalysisResponse)
async def negotiation_assistant(
    request: AnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    ✅ ENDPOINT NAME PRESERVED: /negotiation-assistant
    ✅ FUNCTION NAME PRESERVED: negotiation_assistant
    🔧 LOGIC COMPLETELY REWRITTEN for better email generation
    """
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"📧 Starting Enhanced Negotiation Analysis for: {session_document_id}")
        
        # 🔧 Enhanced retrieval
        formatted_chunks, chunks = await get_enhanced_comprehensive_chunks(
            session_document_id, 
            "negotiation"
        )
        
        if not formatted_chunks.strip():
            raise HTTPException(
                status_code=404, 
                detail="Document content not found."
            )
        
        # 🆕 Enhanced prompt
        prompt = ENHANCED_NEGOTIATION_PROMPT.format(formatted_chunks=formatted_chunks)
        
        system_message = """You are a contract negotiation expert. You MUST respond with valid JSON only.
Follow the exact format specified. Draft professional, diplomatic emails."""
        
        llm_response = await llm_service.call_groq(prompt, system_message)
        
        # 🆕 Validate and repair
        analysis_result = _validate_and_repair_json(llm_response)
        
        if "error" in analysis_result and "emails" not in analysis_result:
            analysis_result = llm_response.get("fallback_analysis", analysis_result)
        
        # 🆕 Quality check
        analysis_result = _verify_analysis_quality(analysis_result, "negotiation")
        
        logger.info(f"✅ Negotiation analysis completed")
        
        return AnalysisResponse(
            analysis=analysis_result,
            relevant_chunks=chunks,
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Negotiation analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/document-summary", response_model=AnalysisResponse)
async def document_summary(
    request: AnalysisRequest,
    current_session: dict = Depends(get_current_session)
):
    """
    ✅ ENDPOINT NAME PRESERVED: /document-summary
    ✅ FUNCTION NAME PRESERVED: document_summary
    🔧 LOGIC COMPLETELY REWRITTEN for comprehensive analysis
    """
    try:
        session_id = current_session["session_id"]
        session_document_id = f"{session_id}_{request.document_id}"
        
        logger.info(f"📄 Starting Enhanced Document Summary for: {session_document_id}")
        
        # 🔧 Enhanced retrieval
        formatted_chunks, chunks = await get_enhanced_comprehensive_chunks(
            session_document_id, 
            "summary"
        )
        
        if not formatted_chunks.strip():
            raise HTTPException(
                status_code=404, 
                detail="Document content not found."
            )
        
        # 🆕 Enhanced prompt
        prompt = ENHANCED_SUMMARY_PROMPT.format(formatted_chunks=formatted_chunks)
        
        system_message = """You are a legal document analyst. You MUST respond with valid JSON only.
Provide comprehensive, detailed analysis. Follow the exact format specified."""
        
        llm_response = await llm_service.call_groq(prompt, system_message)
        
        # 🆕 Validate and repair
        analysis_result = _validate_and_repair_json(llm_response)
        
        if "error" in analysis_result and "summary" not in analysis_result:
            analysis_result = llm_response.get("fallback_analysis", analysis_result)
        
        # 🆕 Quality check
        analysis_result = _verify_analysis_quality(analysis_result, "summary")
        
        logger.info(f"✅ Document summary completed")
        
        return AnalysisResponse(
            analysis=analysis_result,
            relevant_chunks=chunks,
            status="success",
            timestamp=datetime.now().isoformat(),
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Document summary failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Export the router (unchanged)
analysis_router = router
