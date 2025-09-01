// RagAnalysis.jsx - Fixed with Visible Navbar
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { getSessionId } from '../services/api';
import RiskAnalysis from './RiskAnalysis';
import NegotiationAssistant from './NegotiationAssistant';
import DocumentSummarization from './DocumentSummarization';
import './RagAnalysis.css';

const RagAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionId, setSessionId] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);

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

  if (!documentInfo) {
    return <div className="loading">Loading document information...</div>;
  }

  return (
    <div className="rag-analysis-container">
      {/* Header */}
      <div className="analysis-header">
        <h1>📊 AI Legal Document Analysis</h1>
        <p>Comprehensive analysis tools for your legal documents</p>
      </div>

      {/* Document Info */}
      <div className="document-info">
        <h2>📄 Document Information</h2>
        <div className="doc-details">
          <div className="detail-item">
            <span className="label">Document:</span>
            <span className="value">{documentInfo.document_name}</span>
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

      {/* ✅ FIXED NAVIGATION BAR */}
      <div className="analysis-navbar-container">
        <nav className="analysis-navbar">
          <NavLink 
            to="/analysis/risk-analysis" 
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Risk Analysis</span>
          </NavLink>
          
          <NavLink 
            to="/analysis/negotiation-assistant" 
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🤝</span>
            <span className="nav-text">Negotiation Assistant</span>
          </NavLink>
          
          <NavLink 
            to="/analysis/document-summary" 
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📄</span>
            <span className="nav-text">Document Summary</span>
          </NavLink>
        </nav>
      </div>

      {/* ✅ ROUTES FOR COMPONENTS */}
      <div className="analysis-content">
        <Routes>
          <Route 
            path="risk-analysis" 
            element={<RiskAnalysis documentInfo={documentInfo} />} 
          />
          <Route 
            path="negotiation-assistant" 
            element={<NegotiationAssistant documentInfo={documentInfo} />} 
          />
          <Route 
            path="document-summary" 
            element={<DocumentSummarization documentInfo={documentInfo} />} 
          />
          {/* Default route - redirect to risk analysis */}
          <Route 
            path="*" 
            element={<RiskAnalysis documentInfo={documentInfo} />} 
          />
        </Routes>
      </div>

      {/* Footer */}
      <div className="navigation-footer">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Upload
        </button>
      </div>
    </div>
  );
};

export default RagAnalysis;
