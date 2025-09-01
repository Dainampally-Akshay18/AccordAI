// DocumentSummarization.jsx - Comprehensive Document Summary
import React, { useState } from 'react';
import { runDocumentSummary } from '../services/api';

const DocumentSummarization = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    if (!documentInfo?.document_id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await runDocumentSummary(documentInfo.document_id);
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

  return (
    <div className="document-summary-page">
      <div className="page-header">
        <h2>📄 Document Summarization</h2>
        <p>Comprehensive overview of your contract's key elements</p>
        
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating Summary...
            </>
          ) : (
            <>
              <span>📋</span>
              Generate Document Summary
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
        <div className="summary-results">
          {/* Executive Summary */}
          {analysis.analysis.summary && (
            <div className="executive-summary">
              <h3>📋 Executive Summary</h3>
              <p>{analysis.analysis.summary}</p>
            </div>
          )}

          {/* Document Overview */}
          {analysis.analysis.overview && (
            <div className="overview-section">
              <h3>📖 Document Overview</h3>
              <div className="overview-grid">
                {Object.entries(analysis.analysis.overview).map(([key, value]) => (
                  <div key={key} className="overview-item">
                    <span className="overview-label">{key.replace('_', ' ').toUpperCase()}:</span>
                    <span className="overview-value">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Terms */}
          {analysis.analysis.key_terms && (
            <div className="terms-section">
              <h3>🔑 Key Terms & Conditions</h3>
              <div className="terms-grid">
                {analysis.analysis.key_terms.map((term, index) => (
                  <div key={index} className="term-card">
                    <h4>{term.term}</h4>
                    <p>{term.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Terms */}
          {analysis.analysis.financial_terms && (
            <div className="financial-section">
              <h3>💰 Financial Terms</h3>
              <div className="financial-grid">
                {Object.entries(analysis.analysis.financial_terms).map(([key, value]) => (
                  <div key={key} className="financial-item">
                    <span className="financial-label">{key.replace('_', ' ').toUpperCase()}:</span>
                    <span className="financial-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Dates */}
          {analysis.analysis.important_dates && (
            <div className="dates-section">
              <h3>📅 Important Dates</h3>
              <div className="dates-timeline">
                {analysis.analysis.important_dates.map((dateItem, index) => (
                  <div key={index} className={`date-item ${dateItem.importance?.toLowerCase()}`}>
                    <div className="date-marker"></div>
                    <div className="date-content">
                      <div className="date-value">{dateItem.date}</div>
                      <div className="date-description">{dateItem.event}</div>
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

          {/* Party Obligations */}
          {analysis.analysis.obligations && (
            <div className="obligations-section">
              <h3>📋 Party Obligations</h3>
              <div className="obligations-grid">
                {Object.entries(analysis.analysis.obligations).map(([party, obligations]) => (
                  <div key={party} className="obligations-party">
                    <h4>{party.replace('_', ' ').toUpperCase()} Obligations:</h4>
                    <ul>
                      {obligations.map((obligation, index) => (
                        <li key={index}>{obligation}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentSummarization;
