// RagAnalysis.jsx - Enhanced with Perfect Structured Display
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { runRagAnalysis, getSessionId } from '../services/api';
import ReactMarkdown from 'react-markdown';
import './RagAnalysis.css';

const RagAnalysis = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [analysisType, setAnalysisType] = useState('risk_analysis');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState('');
  const [ragResult, setRagResult] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const sessionIdValue = getSessionId();
    if (!sessionIdValue) {
      navigate('/');
      return;
    }
    setSessionId(sessionIdValue);

    const docData = localStorage.getItem('current_document');
    if (docData) {
      const parsedDocData = JSON.parse(docData);
      setDocumentInfo(parsedDocData);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleRagAnalysis = async () => {
    if (!sessionId) {
      setRagError('No session available. Please refresh the page.');
      return;
    }

    if (!documentInfo || !documentInfo.document_id) {
      setRagError('No document ID available.');
      return;
    }

    setRagLoading(true);
    setRagError('');
    setRagResult(null);
    setDebugInfo('');

    try {
      const analysisData = {
        document_id: documentInfo.document_id,
        analysis_type: analysisType,
        jurisdiction: 'US'
      };

      console.log('🔍 Sending analysis request:', analysisData);
      setDebugInfo(`Analyzing document: ${documentInfo.document_id}`);
      
      const response = await runRagAnalysis(analysisData);
      console.log('✅ Analysis response received:', response);

      if (response.success) {
        setRagResult(response.data);
        setDebugInfo(`Analysis completed: ${response.data.relevant_chunks?.length || 0} chunks analyzed`);
      } else {
        throw new Error(response.error || 'Analysis failed');
      }

    } catch (err) {
      console.error('❌ Analysis error:', err);
      
      let errorMessage = err.message || 'Error performing RAG analysis';
      
      if (errorMessage.includes('404')) {
        errorMessage = `Document not found. Please ensure the document was uploaded correctly. Document ID: ${documentInfo.document_id}`;
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Session expired. Please refresh the page and try again.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Server error occurred. Please check if the backend service is running.';
      }
      
      setRagError(errorMessage);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setRagLoading(false);
    }
  };

  // ✅ ENHANCED: Risk Analysis Renderer - Shows ALL risks beautifully
  const renderRiskAnalysis = (analysis) => {
    const risks = analysis.risks || [];
    
    return (
      <div className="structured-analysis risk-analysis">
        <div className="analysis-header">
          <h3>🎯 Comprehensive Risk Analysis</h3>
          <div className="risk-metrics">
            <div className="metric">
              <span className="metric-value">{analysis.overall_risk_score || 'N/A'}</span>
              <span className="metric-label">Risk Score</span>
            </div>
            <div className="metric">
              <span className="metric-value">{risks.length}</span>
              <span className="metric-label">Total Risks</span>
            </div>
          </div>
        </div>

        {analysis.summary && (
          <div className="risk-summary">
            <h4>📋 Executive Summary</h4>
            <p>{analysis.summary}</p>
          </div>
        )}

        <div className="risks-container">
          <h4>🔍 All Identified Risks ({risks.length})</h4>
          
          {risks.map((risk, index) => (
            <div key={index} className={`risk-card ${risk.severity?.toLowerCase()}`}>
              <div className="risk-header">
                <span className="risk-emoji">{risk.emoji || getSeverityEmoji(risk.severity)}</span>
                <h5 className="risk-title">{risk.title}</h5>
                <span className={`severity-badge ${risk.severity?.toLowerCase()}`}>
                  {risk.severity}
                </span>
              </div>
              
              <div className="risk-content">
                <div className="risk-section">
                  <strong>📝 Description:</strong>
                  <p>{risk.description}</p>
                </div>
                
                {risk.clause_reference && (
                  <div className="risk-section">
                    <strong>📄 Clause Reference:</strong>
                    <p>{risk.clause_reference}</p>
                  </div>
                )}
                
                {risk.recommendation && (
                  <div className="risk-section">
                    <strong>💡 Recommendation:</strong>
                    <p>{risk.recommendation}</p>
                  </div>
                )}

                {risk.impact && (
                  <div className="risk-section">
                    <strong>⚡ Potential Impact:</strong>
                    <p>{risk.impact}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {analysis.high_risks !== undefined && (
          <div className="risk-breakdown">
            <h4>📊 Risk Breakdown</h4>
            <div className="breakdown-grid">
              <div className="breakdown-item high">
                <span className="breakdown-emoji">🔴</span>
                <span className="breakdown-count">{analysis.high_risks || 0}</span>
                <span className="breakdown-label">High Risks</span>
              </div>
              <div className="breakdown-item medium">
                <span className="breakdown-emoji">🟡</span>
                <span className="breakdown-count">{analysis.medium_risks || 0}</span>
                <span className="breakdown-label">Medium Risks</span>
              </div>
              <div className="breakdown-item low">
                <span className="breakdown-emoji">🟢</span>
                <span className="breakdown-count">{analysis.low_risks || 0}</span>
                <span className="breakdown-label">Low Risks</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ ENHANCED: Negotiation Strategy Renderer - With both emails
  const renderNegotiationStrategy = (analysis) => {
    const keyPoints = analysis.key_negotiation_points || [];
    const alternativeClauses = analysis.alternative_clauses || [];
    const emails = analysis.emails || {};
    
    return (
      <div className="structured-analysis negotiation-analysis">
        <div className="analysis-header">
          <h3>🤝 Negotiation Strategy</h3>
        </div>

        {analysis.negotiation_strategy && (
          <div className="strategy-overview">
            <h4>🎯 Overall Strategy</h4>
            <p>{analysis.negotiation_strategy}</p>
          </div>
        )}

        {keyPoints.length > 0 && (
          <div className="section">
            <h4>🔑 Key Negotiation Points</h4>
            <div className="negotiation-points">
              {keyPoints.map((point, index) => (
                <div key={index} className="negotiation-point">
                  <div className="point-header">
                    <h5>{point.point}</h5>
                    <span className={`priority-badge ${point.priority?.toLowerCase()}`}>
                      {point.priority}
                    </span>
                  </div>
                  {point.current_issue && (
                    <div className="point-detail">
                      <strong>Current Issue:</strong> {point.current_issue}
                    </div>
                  )}
                  {point.suggested_change && (
                    <div className="point-detail">
                      <strong>Suggested Change:</strong> {point.suggested_change}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {alternativeClauses.length > 0 && (
          <div className="section">
            <h4>📝 Alternative Clauses</h4>
            <div className="alternative-clauses">
              {alternativeClauses.map((clause, index) => (
                <div key={index} className="clause-comparison">
                  <h5>{clause.clause_type}</h5>
                  <div className="clause-before-after">
                    <div className="clause-original">
                      <strong>Original:</strong>
                      <p>{clause.original}</p>
                    </div>
                    <div className="clause-arrow">→</div>
                    <div className="clause-suggested">
                      <strong>Suggested:</strong>
                      <p>{clause.suggested}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ NEW: Both Acceptance and Rejection Emails */}
        <div className="section emails-section">
          <h4>📧 Email Templates</h4>
          
          <div className="email-templates">
            <div className="email-template acceptance">
              <h5>✅ Acceptance Email</h5>
              <div className="email-content">
                <pre>{emails.acceptance || 'Acceptance email template not available'}</pre>
              </div>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(emails.acceptance)}
              >
                📋 Copy Email
              </button>
            </div>

            <div className="email-template rejection">
              <h5>❌ Rejection/Modification Email</h5>
              <div className="email-content">
                <pre>{emails.rejection || 'Rejection email template not available'}</pre>
              </div>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(emails.rejection)}
              >
                📋 Copy Email
              </button>
            </div>
          </div>
        </div>

        {analysis.priority_issues && analysis.priority_issues.length > 0 && (
          <div className="section">
            <h4>⚡ Priority Issues</h4>
            <ul className="priority-list">
              {analysis.priority_issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // ✅ ENHANCED: Document Summary Renderer
  const renderDocumentSummary = (analysis) => {
    const overview = analysis.document_overview || {};
    const keyTerms = analysis.key_terms || [];
    const importantDates = analysis.important_dates || [];
    const financialTerms = analysis.financial_terms || {};
    const obligations = analysis.obligations || {};
    
    return (
      <div className="structured-analysis summary-analysis">
        <div className="analysis-header">
          <h3>📄 Document Summary</h3>
        </div>

        {analysis.summary && (
          <div className="executive-summary">
            <h4>📋 Executive Summary</h4>
            <p>{analysis.summary}</p>
          </div>
        )}

        <div className="summary-sections">
          {/* Document Overview */}
          {Object.keys(overview).length > 0 && (
            <div className="summary-section">
              <h4>📖 Document Overview</h4>
              <div className="overview-grid">
                {overview.contract_type && (
                  <div className="overview-item">
                    <span className="overview-label">Contract Type:</span>
                    <span className="overview-value">{overview.contract_type}</span>
                  </div>
                )}
                {overview.parties && (
                  <div className="overview-item">
                    <span className="overview-label">Parties:</span>
                    <span className="overview-value">{overview.parties.join(', ')}</span>
                  </div>
                )}
                {overview.effective_date && (
                  <div className="overview-item">
                    <span className="overview-label">Effective Date:</span>
                    <span className="overview-value">{overview.effective_date}</span>
                  </div>
                )}
                {overview.expiration_date && (
                  <div className="overview-item">
                    <span className="overview-label">Expiration Date:</span>
                    <span className="overview-value">{overview.expiration_date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Terms */}
          {keyTerms.length > 0 && (
            <div className="summary-section">
              <h4>🔑 Key Terms</h4>
              <div className="terms-list">
                {keyTerms.map((term, index) => (
                  <div key={index} className="term-item">
                    <h5>{term.term}</h5>
                    <p>{term.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Dates */}
          {importantDates.length > 0 && (
            <div className="summary-section">
              <h4>📅 Important Dates</h4>
              <div className="dates-timeline">
                {importantDates.map((dateItem, index) => (
                  <div key={index} className={`date-item ${dateItem.importance?.toLowerCase()}`}>
                    <div className="date-marker"></div>
                    <div className="date-content">
                      <div className="date-value">{dateItem.date}</div>
                      <div className="date-description">{dateItem.description}</div>
                      {dateItem.importance && (
                        <span className={`importance-badge ${dateItem.importance.toLowerCase()}`}>
                          {dateItem.importance}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Terms */}
          {Object.keys(financialTerms).length > 0 && (
            <div className="summary-section">
              <h4>💰 Financial Terms</h4>
              <div className="financial-grid">
                {financialTerms.total_value && (
                  <div className="financial-item">
                    <span className="financial-label">Total Value:</span>
                    <span className="financial-value">{financialTerms.total_value}</span>
                  </div>
                )}
                {financialTerms.payment_schedule && (
                  <div className="financial-item">
                    <span className="financial-label">Payment Schedule:</span>
                    <span className="financial-value">{financialTerms.payment_schedule}</span>
                  </div>
                )}
                {financialTerms.penalties && (
                  <div className="financial-item">
                    <span className="financial-label">Penalties:</span>
                    <span className="financial-value">{financialTerms.penalties}</span>
                  </div>
                )}
                {financialTerms.currency && (
                  <div className="financial-item">
                    <span className="financial-label">Currency:</span>
                    <span className="financial-value">{financialTerms.currency}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Obligations */}
          {Object.keys(obligations).length > 0 && (
            <div className="summary-section">
              <h4>📋 Party Obligations</h4>
              <div className="obligations-grid">
                {obligations.party_a && (
                  <div className="obligations-party">
                    <h5>Party A Obligations:</h5>
                    <ul>
                      {obligations.party_a.map((obligation, index) => (
                        <li key={index}>{obligation}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {obligations.party_b && (
                  <div className="obligations-party">
                    <h5>Party B Obligations:</h5>
                    <ul>
                      {obligations.party_b.map((obligation, index) => (
                        <li key={index}>{obligation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {analysis.risk_factors && analysis.risk_factors.length > 0 && (
            <div className="summary-section">
              <h4>⚠️ Risk Factors</h4>
              <ul className="risk-factors-list">
                {analysis.risk_factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ MAIN: Analysis Content Renderer
  const renderAnalysisContent = (analysis) => {
    if (!analysis) {
      return <div className="no-content">No analysis content available</div>;
    }

    // Handle error responses
    if (analysis.error) {
      return (
        <div className="error-content">
          <h4>❌ Analysis Error:</h4>
          <p>{analysis.error}</p>
        </div>
      );
    }

    // Route to specific renderer based on analysis type
    switch (analysisType) {
      case 'risk_analysis':
        return renderRiskAnalysis(analysis);
      case 'negotiation':
        return renderNegotiationStrategy(analysis);
      case 'summary':
        return renderDocumentSummary(analysis);
      default:
        return renderGenericAnalysis(analysis);
    }
  };

  // Helper functions
  const getSeverityEmoji = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚠️';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Email copied to clipboard!');
    });
  };

  const renderGenericAnalysis = (analysis) => {
    return (
      <div className="generic-analysis">
        <pre className="json-display">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </div>
    );
  };

  const renderRelevantChunks = (chunks) => {
    if (!chunks || chunks.length === 0) {
      return <div className="no-chunks">No relevant document sections found.</div>;
    }

    return (
      <div className="chunks-container">
        {chunks.map((chunk, index) => (
          <div key={index} className="chunk-item">
            <div className="chunk-header">
              <span className="chunk-index">Section {chunk.chunk_index + 1}</span>
              <span className="relevance-score">
                Relevance: {(chunk.relevance_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="chunk-text">{chunk.text}</div>
          </div>
        ))}
      </div>
    );
  };

  if (!documentInfo) {
    return <div className="loading">Loading document information...</div>;
  }

  return (
    <div className="rag-analysis-container">
      <div className="analysis-header">
        <h1>📊 AI Document Analysis</h1>
        <p>Choose an analysis type and get AI-powered insights about your legal document.</p>
      </div>

      <div className="document-info">
        <h2>📄 Document Information</h2>
        <div className="doc-details">
          <div className="detail-item">
            <span className="label">Document:</span>
            <span className="value">{documentInfo.document_name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Document ID:</span>
            <span className="value">{documentInfo.document_id}</span>
          </div>
          <div className="detail-item">
            <span className="label">Chunks:</span>
            <span className="value">{documentInfo.chunks_count}</span>
          </div>
          <div className="detail-item">
            <span className="label">Session:</span>
            <span className="value">{sessionId.substring(0, 12)}...</span>
          </div>
        </div>
      </div>

      <div className="analysis-controls">
        <div className="analysis-type-selector">
          <label htmlFor="analysis-type">Analysis Type:</label>
          <select
            id="analysis-type"
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="analysis-select"
            disabled={ragLoading}
          >
            <option value="risk_analysis">🎯 Risk Analysis</option>
            <option value="negotiation">🤝 Negotiation Strategy</option>
            <option value="summary">📄 Document Summary</option>
          </select>
        </div>

        <button
          onClick={handleRagAnalysis}
          disabled={ragLoading}
          className="analyze-button"
        >
          {ragLoading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              <span className="analyze-icon">🔍</span>
              Start Analysis
            </>
          )}
        </button>
      </div>

      {debugInfo && (
        <div className="debug-info">
          <small>Debug: {debugInfo}</small>
        </div>
      )}

      {ragError && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div className="error-details">
            <strong>Analysis Failed:</strong>
            <p>{ragError}</p>
          </div>
        </div>
      )}

      {ragResult && (
        <div className="analysis-results">
          <div className="results-header">
            <h2>🎯 Analysis Results</h2>
            <div className="result-meta">
              <span>Type: {analysisType.replace('_', ' ').toUpperCase()}</span>
              <span>Chunks Analyzed: {ragResult.relevant_chunks?.length || 0}</span>
              <span>Status: {ragResult.status}</span>
            </div>
          </div>

          <div className="analysis-content">
            <div className="content-display">
              {renderAnalysisContent(ragResult.analysis)}
            </div>
          </div>

          {ragResult.relevant_chunks && ragResult.relevant_chunks.length > 0 && (
            <div className="relevant-chunks">
              <div className="chunks-header">
                <h3>📖 Relevant Document Sections</h3>
                <button
                  className="expand-toggle"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Collapse' : 'Expand'} Sections
                </button>
              </div>
              {isExpanded && renderRelevantChunks(ragResult.relevant_chunks)}
            </div>
          )}
        </div>
      )}

      <div className="navigation-footer">
        <button
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Back to Upload
        </button>
      </div>
    </div>
  );
};

export default RagAnalysis;
