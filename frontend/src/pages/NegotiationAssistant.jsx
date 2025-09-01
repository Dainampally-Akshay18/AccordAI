// NegotiationAssistant.jsx - Clean Email Templates
import React, { useState } from 'react';
import { runNegotiationAssistant } from '../services/api';

const NegotiationAssistant = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    if (!documentInfo?.document_id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await runNegotiationAssistant(documentInfo.document_id);
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Email copied to clipboard!');
    });
  };

  return (
    <div className="negotiation-assistant-page">
      <div className="page-header">
        <h2>🤝 Negotiation Assistant</h2>
        <p>Professional email templates for contract responses</p>
        
        <button 
          onClick={runAnalysis}
          disabled={loading}
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
              Generate Email Templates
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {analysis && (
        <div className="negotiation-results">
          {/* ✅ SIDE-BY-SIDE EMAIL TEMPLATES */}
          <div className="emails-container">
            {/* Acceptance Email */}
            <div className="email-panel acceptance-panel">
              <div className="email-header">
                <h3>✅ Acceptance Email</h3>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(analysis.analysis.emails?.acceptance)}
                >
                  📋 Copy Email
                </button>
              </div>
              <div className="email-content">
                <pre>
                  {analysis.analysis.emails?.acceptance || 'Acceptance email not available'}
                </pre>
              </div>
            </div>

            {/* Rejection Email */}
            <div className="email-panel rejection-panel">
              <div className="email-header">
                <h3>❌ Modification Request Email</h3>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(analysis.analysis.emails?.rejection)}
                >
                  📋 Copy Email
                </button>
              </div>
              <div className="email-content">
                <pre>
                  {analysis.analysis.emails?.rejection || 'Rejection email not available'}
                </pre>
              </div>
            </div>
          </div>

          {/* Key Negotiation Points */}
          {analysis.analysis.key_points && (
            <div className="key-points-section">
              <h3>🔑 Key Negotiation Points</h3>
              <div className="points-grid">
                {analysis.analysis.key_points.map((point, index) => (
                  <div key={index} className="point-card">
                    <h4>{point.issue}</h4>
                    <div className="point-detail">
                      <strong>Concern:</strong>
                      <p>{point.concern}</p>
                    </div>
                    <div className="point-detail">
                      <strong>Suggestion:</strong>
                      <p>{point.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="usage-instructions">
            <h3>💡 How to Use These Templates</h3>
            <ul>
              <li>Replace placeholder text like [Counterparty], [Your Name] with actual information</li>
              <li>Customize the content to match your specific situation</li>
              <li>Review legal implications with your team before sending</li>
              <li>Choose the appropriate template based on your contract decision</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationAssistant;
