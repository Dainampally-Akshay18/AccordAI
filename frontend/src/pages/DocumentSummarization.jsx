// DocumentSummarization.jsx - Enhanced with Better Error Handling
import React, { useState, useEffect } from 'react';
import { runDocumentSummary } from '../services/api';

const DocumentSummarization = ({ documentInfo }) => {
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
    setDebugInfo('Analyzing document content with enhanced Pinecone...');
    
    try {
      console.log('📄 Starting document summary for:', documentInfo.document_id);
      const response = await runDocumentSummary(documentInfo.document_id);
      
      if (response.success) {
        console.log('✅ Document summary successful:', response.data);
        setAnalysis(response.data);
        setDebugInfo(`Summary generated: ${response.data.relevant_chunks?.length || 0} chunks analyzed with Pinecone Enhanced`);
      } else {
        console.error('❌ Document summary failed:', response.error);
        setError(response.error || 'Document summary failed');
        setDebugInfo('Summary generation failed');
      }
    } catch (err) {
      console.error('❌ Document summary error:', err);
      setError('Summary generation failed. Please try again.');
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

  return (
    <div className="document-summary-page">
      <div className="page-header">
        <h2>📄 Document Summary</h2>
        <p>Key insights and important information from your contract</p>
        
        <button 
          onClick={runAnalysis}
          disabled={loading || !documentInfo?.document_id}
          className="analyze-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing Document...
            </>
          ) : (
            <>
              <span>📋</span>
              {analysis ? 'Refresh Summary' : 'Generate Summary'}
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
            <strong>Summary Failed:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {analysis && analysis.analysis && (
        <div className="summary-results">
          {/* Contract Type Header */}
          {analysis.analysis.contract_type && (
            <div className="contract-type-header">
              <h3>📋 {analysis.analysis.contract_type}</h3>
            </div>
          )}

          {/* Executive Summary */}
          {analysis.analysis.summary && (
            <div className="executive-summary-clean">
              <h4>📝 Summary</h4>
              <p>{analysis.analysis.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {analysis.analysis.key_points && analysis.analysis.key_points.length > 0 && (
            <div className="key-points-clean">
              <h4>🔑 Key Points</h4>
              <div className="points-list-clean">
                {analysis.analysis.key_points.map((point, index) => (
                  <div key={index} className="point-item-clean">
                    <span className="point-bullet">•</span>
                    <span className="point-text">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backend info */}
          <div className="backend-info">
            <h4>🔧 Analysis Details</h4>
            <div className="backend-stats">
              <span>Powered by: Pinecone Enhanced Vector Search</span>
              <span>•</span>
              <span>Chunks: {analysis.relevant_chunks?.length || 0}</span>
              <span>•</span>
              <span>Analysis Time: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSummarization;
