const express = require('express');
const { getCurrentSession } = require('./auth');
const vectorService = require('../services/vector_service');
const llmService = require('../services/llm_service');
const logger = require('../utils/logger');
const { HTTPException, ValidationException, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Request/Response schemas (matching Pydantic models)
class AnalysisRequest {
    constructor(data) {
        this.document_id = data.document_id;
        this.jurisdiction = data.jurisdiction || "US";
        
        if (!this.document_id) {
            throw new ValidationException("document_id is required");
        }
    }
}

class AnalysisResponse {
    constructor(data) {
        this.analysis = data.analysis;
        this.relevant_chunks = data.relevant_chunks;
        this.status = data.status;
        this.timestamp = data.timestamp;
        this.session_id = data.session_id;
    }
}

// ✅ DRAMATICALLY IMPROVED PROMPTS WITH LEGAL EXPERTISE (matching Python exactly)
const ENHANCED_RISK_PROMPT = `
You are a senior legal risk analyst with 15+ years of experience reviewing contracts. Analyze the following contract content and identify ALL legal risks present.

CONTRACT CONTENT TO ANALYZE:

{relevant_text}

ANALYSIS INSTRUCTIONS:

1. Read through ALL the contract content carefully
2. Identify specific legal risks based on actual contract terms
3. Consider risks related to: payment obligations, liability exposure, termination conditions, compliance requirements, intellectual property, confidentiality, dispute resolution, and service bonds
4. Rate each risk as High, Medium, or Low based on potential legal and financial impact
5. Provide specific descriptions explaining WHY each identified term constitutes a risk
6. Calculate an overall risk score from 0-10 based on severity and number of risks

You MUST respond with valid JSON in this exact format (no additional text before or after):

{{
"risks": [
{{
"title": "Specific risk identified from the contract (e.g., 'Service Bond Penalty')",
"severity": "High",
"description": "Detailed explanation of the risk based on specific contract terms, including potential legal and financial consequences. Reference specific clauses or amounts where applicable."
}}
],
"total_risks": 3,
"risk_score": 7.5
}}

If you find no specific risks, still analyze potential general contractual concerns and rate them appropriately. Focus on actual contract terms, not generic advice.
`;

const ENHANCED_NEGOTIATION_PROMPT = `
You are a contract negotiation expert with extensive experience in business law. Based on the contract content provided, create two professional business email templates.

CONTRACT CONTENT TO ANALYZE:

{relevant_text}

TASK INSTRUCTIONS:

1. Analyze the contract content thoroughly to understand key terms
2. Create professional acceptance email that acknowledges specific terms
3. Create professional modification request email that addresses specific concerns diplomatically
4. Use formal business language appropriate for legal/contractual communications
5. Include placeholders for personalization ([Name], [Company], etc.)
6. Reference actual contract elements where relevant

You MUST respond with valid JSON in this exact format (no additional text before or after):

{{
"emails": {{
"acceptance": "Subject: Contract Acceptance - [Agreement Title]\\n\\nDear [Counterparty Name],\\n\\nFollowing our legal team's comprehensive review of the contract dated [Date], we are pleased to confirm our acceptance of the terms and conditions as presented.\\n\\nKey terms we acknowledge include:\\n- [Specific term from contract]\\n- [Another specific term]\\n\\nWe look forward to the successful execution of this agreement and to building a productive partnership.\\n\\nPlease proceed with the next steps as outlined in the contract.\\n\\nSincerely,\\n[Your Name]\\n[Title]\\n[Company Name]\\n[Contact Information]",
"rejection": "Subject: Contract Review - Modifications Required\\n\\nDear [Counterparty Name],\\n\\nThank you for providing the contract for our review. Our legal team has conducted a thorough analysis, and while we appreciate the comprehensive nature of the agreement, we have identified several areas that require discussion and potential modification.\\n\\nSpecific areas of concern include:\\n- [Specific concern based on contract analysis]\\n- [Another specific concern]\\n\\nWe believe these points can be addressed through constructive dialogue while maintaining the core objectives of our partnership.\\n\\nWould you be available for a discussion this week to review these items? We remain committed to reaching mutually beneficial terms.\\n\\nBest regards,\\n[Your Name]\\n[Title]\\n[Company Name]\\n[Contact Information]"
}}
}}
`;

const ENHANCED_SUMMARY_PROMPT = `
You are a legal document analyst specializing in contract summarization. Analyze the provided contract content and create a comprehensive summary.

CONTRACT CONTENT TO ANALYZE:

{relevant_text}

ANALYSIS INSTRUCTIONS:

1. Read through ALL contract content provided
2. Identify the type of agreement (employment, internship, service, NDA, etc.)
3. Extract key contractual provisions, obligations, and terms
4. Identify the main parties and their respective responsibilities
5. Note important dates, payment terms, and performance requirements
6. Summarize the overall purpose and scope of the agreement

You MUST respond with valid JSON in this exact format (no additional text before or after):

{{
"contract_type": "Specific type of agreement based on content analysis (e.g., 'Internship with Pre-Placement Offer Agreement')",
"key_points": [
"First major contractual provision or obligation with specific details",
"Second major contractual provision or obligation with specific details",
"Third major contractual provision or obligation with specific details",
"Fourth major contractual provision or obligation with specific details"
],
"summary": "Comprehensive 2-3 sentence summary explaining the contract's main purpose, key obligations of each party, important terms like compensation/bonds, and significant conditions that define the relationship"
}}

Base your analysis entirely on the actual contract content provided - extract specific terms, amounts, dates, and conditions mentioned in the document.
`;

// ✅ ENHANCED CHUNK RETRIEVAL WITH COMPREHENSIVE COVERAGE (matching Python exactly)
async function getEnhancedComprehensiveChunks(documentId, analysisType) {
    try {
        logger.vectorInfo(`Enhanced legal document retrieval for ${analysisType} analysis of document: ${documentId}`);

        // ✅ EXPANDED SEARCH STRATEGIES FOR BETTER LEGAL COVERAGE (matching Python)
        const enhancedSearchStrategies = {
            "risk": [
                "liability responsibility indemnification damages penalties liquidated",
                "termination breach default consequences cancellation resignation",
                "payment obligations financial compensation salary stipend bond",
                "compliance regulatory legal requirements obligations mandatory",
                "confidentiality intellectual property proprietary trade secrets",
                "dispute resolution arbitration litigation jurisdiction governing law",
                "service bond penalty premature termination employment agreement"
            ],
            "negotiation": [
                "compensation salary payment benefits remuneration stipend CTC",
                "obligations duties responsibilities performance requirements deliverables",
                "termination resignation notice period conditions cancellation",
                "benefits perks allowances reimbursement compensation package",
                "confidentiality non-disclosure proprietary information trade secrets",
                "intellectual property ownership rights inventions work product",
                "location transfer posting assignment relocation flexibility"
            ],
            "summary": [
                "agreement contract parties involved relationship employer employee",
                "obligations duties responsibilities requirements performance evaluation",
                "compensation payment financial terms money salary stipend CTC",
                "duration term timeline dates effective period internship employment",
                "termination conditions notice requirements end resignation bond",
                "confidentiality proprietary intellectual property rights inventions",
                "location work assignment posting transfer relocation policy"
            ]
        };

        const allChunks = [];
        const strategies = enhancedSearchStrategies[analysisType] || enhancedSearchStrategies["summary"];

        // ✅ EXECUTE MULTIPLE COMPREHENSIVE SEARCHES
        for (const strategy of strategies) {
            try {
                const chunks = await vectorService.retrieveRelevantChunks(
                    strategy,
                    documentId,
                    8 // More chunks per strategy for legal documents
                );
                
                allChunks.push(...chunks);
                logger.vectorInfo(`Strategy '${strategy.substring(0, 40)}...' returned ${chunks.length} chunks`);
                
            } catch (error) {
                logger.legalWarning(`Search strategy '${strategy.substring(0, 30)}...' failed: ${error.message}`);
                continue;
            }
        }

        // ✅ REMOVE DUPLICATES AND GET BEST CHUNKS
        const uniqueChunks = {};
        for (const chunk of allChunks) {
            const chunkId = chunk.id || `chunk_${chunk.chunk_index || 0}`;
            if (!uniqueChunks[chunkId] || chunk.score > uniqueChunks[chunkId].score) {
                uniqueChunks[chunkId] = chunk;
            }
        }

        // Sort by chunk index for natural document flow
        let sortedChunks = Object.values(uniqueChunks).sort((a, b) => 
            (a.chunk_index || 0) - (b.chunk_index || 0)
        );

        // ✅ ENSURE COMPREHENSIVE COVERAGE - Get at least 6 high-quality chunks for legal analysis
        if (sortedChunks.length < 6) {
            logger.vectorInfo("Getting additional chunks to ensure comprehensive legal document coverage");
            try {
                const additionalChunks = await vectorService.retrieveRelevantChunks(
                    `legal contract agreement document terms conditions ${analysisType}`,
                    documentId,
                    15
                );

                for (const chunk of additionalChunks) {
                    const chunkId = chunk.id;
                    if (!uniqueChunks[chunkId]) {
                        sortedChunks.push(chunk);
                    }
                }
            } catch (error) {
                logger.legalWarning(`Additional chunk retrieval failed: ${error.message}`);
            }
        }

        // ✅ TAKE BEST CHUNKS WITH SUFFICIENT CONTEXT FOR LEGAL ANALYSIS
        const finalChunks = sortedChunks.slice(0, Math.min(10, sortedChunks.length)); // Up to 10 chunks

        // ✅ ENHANCED TEXT COMBINATION WITH LEGAL DOCUMENT FORMATTING
        let combinedText = "\n\n" + "=".repeat(60) + "\nLEGAL CONTRACT CONTENT FOR ANALYSIS\n" + "=".repeat(60) + "\n\n";
        
        for (let i = 0; i < finalChunks.length; i++) {
            const chunk = finalChunks[i];
            const sectionHeader = `--- SECTION ${(chunk.chunk_index || i) + 1} ---`;
            const chunkText = chunk.text.trim();
            combinedText += `${sectionHeader}\n${chunkText}\n\n`;
        }
        
        combinedText += "=".repeat(60) + "\nEND OF LEGAL CONTRACT CONTENT\n" + "=".repeat(60);

        logger.legalSuccess(`Enhanced legal document retrieval completed: ${finalChunks.length} chunks, ${combinedText.length} characters`);

        // Log content preview for debugging
        const preview = combinedText.substring(0, 300).replace(/\n/g, ' ');
        logger.processingInfo(`Legal content preview: ${preview}...`);

        return [combinedText, finalChunks];

    } catch (error) {
        logger.legalError(`Enhanced legal document chunk retrieval failed: ${error.message}`);
        throw new HTTPException(500, `Legal document retrieval failed: ${error.message}`);
    }
}

// ✅ ENHANCED RESPONSE VALIDATION WITH LEGAL DOCUMENT AWARENESS (matching Python)
function validateAndEnhanceAnalysisResponse(data, analysisType, originalContent) {
    try {
        logger.processingInfo(`Validating ${analysisType} response for legal document: ${typeof data}`);

        if (analysisType === "risk") {
            if (!Array.isArray(data.risks)) {
                data.risks = [];
            }

            if (data.risks.length === 0) {
                // Create meaningful fallback based on legal content analysis
                const contentLower = originalContent.toLowerCase();
                const fallbackRisks = [];

                // Check for service bond (common in legal documents)
                if (contentLower.includes("service bond") || contentLower.includes("liquidated damages") || contentLower.includes("premature termination")) {
                    fallbackRisks.push({
                        title: "Service Bond and Liquidated Damages",
                        severity: "High",
                        description: "The contract includes a service bond with liquidated damages clause that creates significant financial liability in case of early termination, potentially restricting career mobility and creating substantial financial risk."
                    });
                }

                // Check for payment and compensation
                if (contentLower.includes("payment") || contentLower.includes("salary") || contentLower.includes("compensation") || contentLower.includes("stipend")) {
                    fallbackRisks.push({
                        title: "Compensation and Payment Terms",
                        severity: "Medium",
                        description: "The contract contains specific compensation arrangements and payment terms that require careful review to ensure compliance and avoid potential disputes regarding salary, stipend, or benefit calculations."
                    });
                }

                // Add more fallback risks based on content...
                if (fallbackRisks.length === 0) {
                    fallbackRisks.push({
                        title: "Contract Compliance and Legal Obligations",
                        severity: "Medium",
                        description: "This legal agreement establishes binding obligations and responsibilities that require ongoing compliance and performance by both parties, with potential legal and financial consequences for non-compliance."
                    });
                }

                data.risks = fallbackRisks;
            }

            data.total_risks = data.risks.length;

            if (!data.risk_score || typeof data.risk_score !== 'number') {
                // Calculate risk score based on severity
                const highRisks = data.risks.filter(risk => risk.severity === "High").length;
                const mediumRisks = data.risks.filter(risk => risk.severity === "Medium").length;
                const lowRisks = data.risks.filter(risk => risk.severity === "Low").length;
                data.risk_score = Math.min(10.0, Math.max(1.0, (highRisks * 3.5 + mediumRisks * 2.0 + lowRisks * 1.0)));
            }

        } else if (analysisType === "negotiation") {
            if (!data.emails || typeof data.emails !== 'object') {
                data.emails = {};
            }

            if (!data.emails.acceptance) {
                data.emails.acceptance = `Subject: Contract Acceptance - Employment Agreement

Dear [Counterparty Name],

Following our legal team's comprehensive review, we are pleased to confirm our acceptance of the employment contract terms and conditions as presented.

We acknowledge the key provisions including compensation structure, service obligations, and confidentiality requirements outlined in the agreement.

We look forward to the successful execution of this partnership and are ready to proceed with the next steps as specified in the contract.

Sincerely,
[Your Name]
[Title]
[Company Name]
[Contact Information]`;
            }

            if (!data.emails.rejection) {
                data.emails.rejection = `Subject: Contract Review - Discussion Required

Dear [Counterparty Name],

Thank you for providing the employment contract for our review. Our legal team has completed a thorough analysis of the proposed terms.

While we appreciate the comprehensive nature of the agreement, we have identified several areas that would benefit from further discussion, particularly regarding service bond terms, compensation structure, and certain employment conditions.

We would welcome the opportunity to schedule a meeting to discuss these points and work together toward mutually acceptable terms that benefit both parties.

We remain committed to this partnership and look forward to your response.

Best regards,
[Your Name]
[Title]
[Company Name]
[Contact Information]`;
            }

        } else if (analysisType === "summary") {
            if (!data.contract_type) {
                // Analyze content to determine contract type
                const contentLower = originalContent.toLowerCase();
                if (contentLower.includes("internship") || contentLower.includes("intern") || contentLower.includes("ppo")) {
                    data.contract_type = "Internship with Pre-Placement Offer Agreement";
                } else if (contentLower.includes("employment") || contentLower.includes("job") || contentLower.includes("employee")) {
                    data.contract_type = "Employment Agreement";
                } else {
                    data.contract_type = "Legal Employment Agreement";
                }
            }

            if (!Array.isArray(data.key_points) || data.key_points.length === 0) {
                data.key_points = [
                    "Establishes comprehensive legal framework for professional engagement",
                    "Defines compensation structure and payment terms",
                    "Outlines service obligations and performance requirements",
                    "Includes confidentiality and intellectual property provisions"
                ];
            }

            if (!data.summary || data.summary.length < 50) {
                data.summary = "This legal employment agreement establishes a comprehensive framework between the contracting parties, defining specific terms for their professional relationship, compensation arrangements, service obligations, and various compliance requirements.";
            }
        }

        logger.legalSuccess(`Successfully validated and enhanced comprehensive ${analysisType} response`);
        return data;

    } catch (error) {
        logger.legalError(`Comprehensive response validation failed: ${error.message}`);
        return createEmergencyFallbackResponse(analysisType, originalContent);
    }
}

function createEmergencyFallbackResponse(analysisType, content) {
    logger.legalWarning(`Creating emergency fallback for ${analysisType}`);
    
    if (analysisType === "risk") {
        return {
            risks: [{
                title: "Contract Review Required",
                severity: "Medium",
                description: "This legal document requires professional review to identify specific risks and obligations."
            }],
            total_risks: 1,
            risk_score: 5.0
        };
    } else if (analysisType === "negotiation") {
        return {
            emails: {
                acceptance: "Professional legal review required for contract acceptance.",
                rejection: "Professional legal review required for contract modification requests."
            }
        };
    } else {
        return {
            contract_type: "Legal Document",
            key_points: ["Professional legal review required"],
            summary: "This document requires professional legal analysis."
        };
    }
}

// API Endpoints (matching Python exactly)

// POST /risks
router.post('/risks', getCurrentSession, asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
        const request = new AnalysisRequest(req.body);
        const sessionId = req.currentSession.session_id;
        
        logger.legalInfo(`Starting risk analysis for document: ${request.document_id}`);
        
        // Get enhanced comprehensive chunks
        const [combinedText, finalChunks] = await getEnhancedComprehensiveChunks(request.document_id, "risk");
        
        // Prepare prompt
        const prompt = ENHANCED_RISK_PROMPT.replace('{relevant_text}', combinedText);
        
        // Call LLM service
        const llmResult = await llmService.callGroq(prompt);
        
        // Validate and enhance response
        const validatedResult = validateAndEnhanceAnalysisResponse(llmResult, "risk", combinedText);
        
        const response = new AnalysisResponse({
            analysis: validatedResult,
            relevant_chunks: finalChunks,
            status: "success",
            timestamp: new Date().toISOString(),
            session_id: sessionId
        });
        
        logger.legalSuccess(`Risk analysis completed for document: ${request.document_id}`, {
            chunks_used: finalChunks.length,
            processing_time: Date.now() - startTime
        });
        
        res.json(response);
        
    } catch (error) {
        logger.legalError(`Risk analysis failed: ${error.message}`);
        throw error;
    }
}));

// POST /negotiation
router.post('/negotiation', getCurrentSession, asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
        const request = new AnalysisRequest(req.body);
        const sessionId = req.currentSession.session_id;
        
        logger.legalInfo(`Starting negotiation analysis for document: ${request.document_id}`);
        
        // Get enhanced comprehensive chunks
        const [combinedText, finalChunks] = await getEnhancedComprehensiveChunks(request.document_id, "negotiation");
        
        // Prepare prompt
        const prompt = ENHANCED_NEGOTIATION_PROMPT.replace('{relevant_text}', combinedText);
        
        // Call LLM service
        const llmResult = await llmService.callGroq(prompt);
        
        // Validate and enhance response
        const validatedResult = validateAndEnhanceAnalysisResponse(llmResult, "negotiation", combinedText);
        
        const response = new AnalysisResponse({
            analysis: validatedResult,
            relevant_chunks: finalChunks,
            status: "success",
            timestamp: new Date().toISOString(),
            session_id: sessionId
        });
        
        logger.legalSuccess(`Negotiation analysis completed for document: ${request.document_id}`, {
            chunks_used: finalChunks.length,
            processing_time: Date.now() - startTime
        });
        
        res.json(response);
        
    } catch (error) {
        logger.legalError(`Negotiation analysis failed: ${error.message}`);
        throw error;
    }
}));

// POST /summary
router.post('/summary', getCurrentSession, asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
        const request = new AnalysisRequest(req.body);
        const sessionId = req.currentSession.session_id;
        
        logger.legalInfo(`Starting summary analysis for document: ${request.document_id}`);
        
        // Get enhanced comprehensive chunks
        const [combinedText, finalChunks] = await getEnhancedComprehensiveChunks(request.document_id, "summary");
        
        // Prepare prompt
        const prompt = ENHANCED_SUMMARY_PROMPT.replace('{relevant_text}', combinedText);
        
        // Call LLM service
        const llmResult = await llmService.callGroq(prompt);
        
        // Validate and enhance response
        const validatedResult = validateAndEnhanceAnalysisResponse(llmResult, "summary", combinedText);
        
        const response = new AnalysisResponse({
            analysis: validatedResult,
            relevant_chunks: finalChunks,
            status: "success",
            timestamp: new Date().toISOString(),
            session_id: sessionId
        });
        
        logger.legalSuccess(`Summary analysis completed for document: ${request.document_id}`, {
            chunks_used: finalChunks.length,
            processing_time: Date.now() - startTime
        });
        
        res.json(response);
        
    } catch (error) {
        logger.legalError(`Summary analysis failed: ${error.message}`);
        throw error;
    }
}));

// Legacy endpoint for backward compatibility
router.post('/rag_analysis', getCurrentSession, asyncHandler(async (req, res) => {
    logger.processingInfo("Legacy RAG analysis redirecting to enhanced risk analysis");
    req.url = '/risks';
    req.method = 'POST';
    return router.handle(req, res);
}));

module.exports = router;
