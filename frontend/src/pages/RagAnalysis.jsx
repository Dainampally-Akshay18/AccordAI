// RagAnalysis.jsx - Enhanced with Fixed Routing and Error Handling
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const sessionIdValue = getSessionId();
        if (!sessionIdValue) {
          setError('No session found. Please refresh the page.');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        setSessionId(sessionIdValue);

        const docData = localStorage.getItem('current_document');
        if (docData) {
          const parsedDocData = JSON.parse(docData);
          setDocumentInfo(parsedDocData);
          console.log('📄 Document loaded:', parsedDocData);
        } else {
          setError('No document found. Please upload a document first.');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError('Failed to initialize analysis page.');
      } finally {
        setLoading(false);
      }
    };

    initializeComponent();
  }, [navigate]);

  // Auto-redirect to risk analysis if on base analysis page
  useEffect(() => {
    if (location.pathname === '/analysis' || location.pathname === '/analysis/') {
      navigate('/analysis/risk-analysis', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Loading analysis tools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
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

      {/* ✅ ENHANCED NAVIGATION */}
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

      {/* ✅ ENHANCED ROUTES */}
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
          {/* Default redirect */}
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
