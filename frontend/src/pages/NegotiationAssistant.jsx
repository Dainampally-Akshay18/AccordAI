// NegotiationAssistant.jsx - Enhanced Email Templates with Better Parsing
import React, { useState, useEffect } from 'react';
import { runNegotiationAssistant } from '../services/api';

const NegotiationAssistant = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const runAnalysis = async () => {
    if (!documentInfo?.document_id) {
      setError('No document ID available for analysis.');
      return;
    }
    
    setLoading(true);
    setError('');
    setDebugInfo('Generating email templates with enhanced Pinecone...');
    
    try {
      console.log('🤝 Starting negotiation analysis for:', documentInfo.document_id);
      const response = await runNegotiationAssistant(documentInfo.document_id);
      
      if (response.success) {
        console.log('✅ Negotiation analysis successful:', response.data);
        setAnalysis(response.data);
        setDebugInfo(`Templates generated: ${response.data.relevant_chunks?.length || 0} chunks analyzed with Pinecone Enhanced`);
      } else {
        console.error('❌ Negotiation analysis failed:', response.error);
        setError(response.error || 'Email generation failed');
        setDebugInfo('Generation failed');
      }
    } catch (err) {
      console.error('❌ Negotiation analysis error:', err);
      setError('Email generation failed. Please try again.');
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis when component mounts
  useEffect(() => {
    if (documentInfo?.document_id && !analysis && !loading) {
      runAnalysis();
    }
  }, [documentInfo?.document_id]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✅ Email copied to clipboard!';
      notification.className = 'copy-notification';
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy email to clipboard');
    });
  };

  return (
    <div className="negotiation-assistant-page">
      <div className="page-header">
        <h2>🤝 Negotiation Assistant</h2>
        <p>Professional email templates for contract responses</p>
        
        <button 
          onClick={runAnalysis}
          disabled={loading || !documentInfo?.document_id}
          className="analyze-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating Templates...
            </>
          ) : (
            <>
              <span>📧</span>
              {analysis ? 'Regenerate Templates' : 'Generate Email Templates'}
            </>
          )}
        </button>
      </div>

      {debugInfo && (
        <div className="debug-info">
          <small>Status: {debugInfo}</small>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Generation Failed:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {analysis && analysis.analysis && analysis.analysis.emails && (
        <div className="negotiation-results">
          {/* ✅ CLEAN SIDE-BY-SIDE EMAIL TEMPLATES */}
          <div className="emails-container-clean">
            {/* Acceptance Email */}
            <div className="email-panel-clean acceptance">
              <div className="email-header-clean">
                <div className="email-title">
                  <span className="email-icon">✅</span>
                  <h3>Acceptance Email</h3>
                </div>
                <button 
                  className="copy-btn-clean"
                  onClick={() => copyToClipboard(analysis.analysis.emails.acceptance)}
                >
                  📋 Copy
                </button>
              </div>
              <div className="email-content-clean">
                <pre className="email-text-clean">
                  {analysis.analysis.emails.acceptance || 'Acceptance email not available'}
                </pre>
              </div>
            </div>

            {/* Rejection Email */}
            <div className="email-panel-clean rejection">
              <div className="email-header-clean">
                <div className="email-title">
                  <span className="email-icon">❌</span>
                  <h3>Modification Request</h3>
                </div>
                <button 
                  className="copy-btn-clean"
                  onClick={() => copyToClipboard(analysis.analysis.emails.rejection)}
                >
                  📋 Copy
                </button>
              </div>
              <div className="email-content-clean">
                <pre className="email-text-clean">
                  {analysis.analysis.emails.rejection || 'Rejection email not available'}
                </pre>
              </div>
            </div>
          </div>

          {/* Quick Instructions */}
          <div className="quick-instructions">
            <h4>💡 Quick Guide</h4>
            <div className="instructions-grid">
              <div className="instruction-item">
                <span className="instruction-icon">✏️</span>
                <span>Replace [Counterparty], [Your Name] with actual names</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">📝</span>
                <span>Review content before sending</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">⚖️</span>
                <span>Consider legal review for important contracts</span>
              </div>
            </div>
          </div>

          {/* Backend info */}
          <div className="backend-info">
            <h4>🔧 Analysis Details</h4>
            <div className="backend-stats">
              <span>Powered by: Pinecone Enhanced Vector Search</span>
              <span>•</span>
              <span>Chunks: {analysis.relevant_chunks?.length || 0}</span>
              <span>•</span>
              <span>Professional Templates Generated</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationAssistant;
