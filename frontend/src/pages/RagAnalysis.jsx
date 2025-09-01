import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { runRagAnalysis } from '../services/api'
import ReactMarkdown from 'react-markdown'
import './RagAnalysis.css'

const RagAnalysis = () => {
  const navigate = useNavigate()
  const [sessionToken, setSessionToken] = useState('')
  const [documentInfo, setDocumentInfo] = useState(null)
  const [analysisType, setAnalysisType] = useState('risk_analysis')
  const [ragLoading, setRagLoading] = useState(false)
  const [ragError, setRagError] = useState('')
  const [ragResult, setRagResult] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Get session token
    const token = localStorage.getItem('session_token')
    if (!token) {
      navigate('/')
      return
    }
    setSessionToken(token)
    
    // Get document info
    const docData = localStorage.getItem('current_document')
    if (docData) {
      setDocumentInfo(JSON.parse(docData))
    } else {
      navigate('/')
    }
  }, [navigate])

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/v1/documents/create_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setSessionToken(data.session_token)
      localStorage.setItem('session_token', data.session_token)
      return data.session_token
    } catch (err) {
      throw new Error('Failed to refresh session')
    }
  }

  const handleRagAnalysis = async () => {
    if (!sessionToken) {
      setRagError('No session available. Please refresh the page.')
      return
    }
    if (!documentInfo || !documentInfo.document_id) {
      setRagError('No document ID available.')
      return
    }
    
    setRagLoading(true)
    setRagError('')
    setRagResult(null)
    
    let currentToken = sessionToken
    try {
      const analysisData = {
        document_id: documentInfo.document_id,
        analysis_type: analysisType,
        jurisdiction: 'US'
      }
      let response = await runRagAnalysis(analysisData, currentToken)
      console.log("Analysis Response:", response)
      setRagResult(response)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('expired')) {
        try {
          console.log('Token expired during analysis, refreshing...')
          currentToken = await refreshSession()
          
          const analysisData = {
            document_id: documentInfo.document_id,
            analysis_type: analysisType,
            jurisdiction: 'US'
          }
          const response = await runRagAnalysis(analysisData, currentToken)
          setRagResult(response)
        } catch (refreshErr) {
          setRagError(refreshErr.message || 'Failed to refresh session and retry analysis')
        }
      } else {
        setRagError(err.message || 'Error performing RAG analysis')
      }
    } finally {
      setRagLoading(false)
    }
  }

  const renderAnalysisContent = (analysis) => {
    if (typeof analysis === 'string') {
      return (
        <div className="analysis-text-display">
          <div className="formatted-text">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="md-h1" {...props} />,
                h2: ({node, ...props}) => <h2 className="md-h2" {...props} />,
                h3: ({node, ...props}) => <h3 className="md-h3" {...props} />,
                p: ({node, ...props}) => <p className="md-p" {...props} />,
                ul: ({node, ...props}) => <ul className="md-ul" {...props} />,
                ol: ({node, ...props}) => <ol className="md-ol" {...props} />,
                li: ({node, ...props}) => <li className="md-li" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="md-blockquote" {...props} />,
                code: ({node, ...props}) => <code className="md-code" {...props} />,
                pre: ({node, ...props}) => <pre className="md-pre" {...props} />,
                strong: ({node, ...props}) => <strong className="md-strong" {...props} />,
                em: ({node, ...props}) => <em className="md-em" {...props} />
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )
    }
    if (typeof analysis === 'object') {
      return (
        <div className="analysis-object-display">
          <pre className="analysis-json">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </div>
      )
    }
    return (
      <div className="analysis-fallback">
        <p>No analysis content available</p>
      </div>
    )
  }

  const renderAnalysisResult = () => {
    if (!ragResult) return null
    const { analysis, relevant_chunks, status, timestamp } = ragResult
    
    return (
      <div className="analysis-results">
        <div className="result-header">
          <div className="result-title">
            <div className="result-icon">
              {analysisType === 'risk_analysis' && '🚨'}
              {analysisType === 'negotiation' && '💼'}
              {analysisType === 'summary' && '📄'}
            </div>
            <div>
              <h3>
                {analysisType === 'risk_analysis' && 'Risk Analysis'}
                {analysisType === 'negotiation' && 'Negotiation Strategy'}
                {analysisType === 'summary' && 'Document Summary'}
              </h3>
              <div className="result-subtitle">AI-powered insights</div>
            </div>
          </div>
          <div className="result-meta">
            <span className={`status-badge ${status === 'completed' ? 'status-success' : 'status-pending'}`}>
              {status === 'completed' ? 'Completed' : 'Processing'}
            </span>
            <span className="timestamp">
              {timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time'}
            </span>
          </div>
        </div>
        
        <div className="analysis-content">
          <div className="main-analysis">
            <div className="analysis-section">
              <div className="section-header">
                <h4>Analysis Report</h4>
                <button 
                  className="expand-button"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <div className={`analysis-body ${isExpanded ? 'expanded' : ''}`}>
                {renderAnalysisContent(analysis)}
              </div>
            </div>
          </div>
          
          {/* Relevant chunks section */}
          <div className="relevant-chunks-section">
            <div className="chunks-header">
              <h4>Relevant Document Sections</h4>
              <span className="chunks-count">{relevant_chunks?.length || 0} sections</span>
            </div>
            
            <div className="chunks-list">
              {relevant_chunks && relevant_chunks.length > 0 ? (
                relevant_chunks.map((chunk, index) => (
                  <div key={index} className="chunk-card">
                    <div className="chunk-header">
                      <span className="chunk-number">Section {(chunk.chunk_index || index) + 1}</span>
                      <div className="relevance-meter">
                        <div className="relevance-bar">
                          <div 
                            className="relevance-fill" 
                            style={{ width: `${(chunk.relevance_score || 0.5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="relevance-score">
                          {((chunk.relevance_score || 0.5) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="chunk-text">
                      {chunk.text || 'No text content available'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-chunks">
                  <p>No relevant document sections found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!documentInfo) {
    return (
      <div className="analysis-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading document information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <button 
          onClick={() => navigate('/')} 
          className="back-button"
        >
          <span className="back-icon">←</span>
          Back to Upload
        </button>
        <div className="page-title">
          <div className="title-icon">📄</div>
          <h1>Document Analysis</h1>
        </div>
      </div>
      
      {/* Document Info Card */}
      <div className="document-info-card">
        <div className="doc-info-header">
          <div className="doc-icon">📋</div>
          <h3>Document Information</h3>
        </div>
        <div className="doc-details">
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{documentInfo.document_name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Document ID:</span>
            <span className="detail-value">{documentInfo.document_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Chunks:</span>
            <span className="detail-value">{documentInfo.chunks_stored}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{documentInfo.upload_mode}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Processed:</span>
            <span className="detail-value">{new Date(documentInfo.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* AI Analysis Section */}
      <div className="ai-analysis-card">
        <div className="analysis-controls">
          <div className="controls-header">
            <div className="controls-icon">🤖</div>
            <h3>AI Legal Analysis</h3>
          </div>
          
          <div className="analysis-options">
            <label htmlFor="analysis-type">Choose Analysis Type:</label>
            <div className="custom-select">
              <select 
                id="analysis-type"
                value={analysisType} 
                onChange={(e) => setAnalysisType(e.target.value)}
                className="analysis-select"
              >
                <option value="risk_analysis">🚨 Risk Analysis</option>
                <option value="negotiation">💼 Negotiation Points</option>
                <option value="summary">📄 Document Summary</option>
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>
          
          <button
            onClick={handleRagAnalysis}
            disabled={ragLoading}
            className="analyze-button"
          >
            {ragLoading ? (
              <>
                <div className="button-spinner"></div>
                Analyzing...
              </>
            ) : (
              <>
                <div className="button-icon">🔍</div>
                Start Analysis
              </>
            )}
          </button>
          
          <div className="analysis-description">
            <p>Choose an analysis type and get AI-powered insights about your legal document.</p>
          </div>
        </div>
        
        {ragError && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h4>Analysis Failed</h4>
              <p>{ragError}</p>
            </div>
          </div>
        )}
        
        {renderAnalysisResult()}
      </div>
    </div>
  )
}

export default RagAnalysis