// RagAnalysis.jsx - Mobile-Optimized with Better Spacing
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { getSessionId } from '../services/api';
import RiskAnalysis from './RiskAnalysis';
import NegotiationAssistant from './NegotiationAssistant';
import DocumentSummarization from './DocumentSummarization';
import Chatbot from './Chatbot';

const RagAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionId, setSessionId] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Touch gesture tracking
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    
    // Swipe right to open (from left edge)
    if (swipeDistance > 100 && touchStartX.current < 50) {
      setSidebarOpen(true);
    }
    
    // Swipe left to close (when sidebar is open)
    if (swipeDistance < -100 && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Add touch listeners
  useEffect(() => {
    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center pt-16 px-4">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading Analysis Tools</h2>
          <p className="text-slate-400">Preparing your document analysis interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 pt-20">
        <div className="bg-slate-800/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 max-w-lg mx-auto text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Analysis Error</h2>
          <p className="text-red-300 mb-8 leading-relaxed">{error}</p>
          <button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Back to Home
            </div>
          </button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { 
      to: '/analysis/risk-analysis', 
      icon: '🔍', 
      label: 'Risk Analysis',
      description: 'Identify potential risks'
    },
    { 
      to: '/analysis/document-summary', 
      icon: '📄', 
      label: 'Document Summary',
      description: 'AI-powered summarization'
    },
    { 
      to: '/analysis/negotiation-assistant', 
      icon: '🤝', 
      label: 'Negotiation Assistant',
      description: 'Strategic guidance'
    },
    { 
      to: '/analysis/chatbot', 
      icon: '💬', 
      label: 'Chatbot',
      description: 'Interactive Q&A assistant'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex pt-16">
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static top-16 bottom-0 left-0 z-50 w-80 lg:w-72 bg-slate-900/98 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Sidebar Header */}
          <div className="p-5 lg:p-6 border-b border-slate-700/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl lg:text-3xl">📊</div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Analysis Tools
                  </h2>
                  <p className="text-xs text-slate-400">Legal Document AI</p>
                </div>
              </div>
              
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Document Info in Sidebar */}
            {documentInfo && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-2">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Current Document
                </div>
                <p className="text-white text-sm break-words font-medium leading-snug">
                  {documentInfo.document_name || documentInfo.filename || documentInfo.document_id}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 lg:p-4">
            <div className="space-y-3">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-start gap-3 px-4 py-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`
                  }
                >
                  <span className="text-2xl lg:text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm lg:text-sm mb-1">{item.label}</div>
                    <div className="text-xs opacity-75 leading-snug">{item.description}</div>
                  </div>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 lg:p-4 border-t border-slate-700/50 flex-shrink-0">
            <button 
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 text-sm font-medium"
              onClick={() => navigate('/')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Back to Upload
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar - Simplified for Mobile */}
        <header className="bg-slate-800/60 backdrop-blur-xl border-b border-slate-700/50 flex-shrink-0">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open sidebar"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Page Title - Simplified on Mobile */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate">
                  Legal Analysis
                </h1>
                <p className="text-slate-400 text-xs hidden md:block truncate">
                  Comprehensive analysis tools for your legal documents
                </p>
              </div>

              {/* User/Session Info - Hidden on small mobile */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-1.5 lg:px-3 lg:py-2 bg-slate-900/60 rounded-lg border border-slate-700/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Better Mobile Padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-7xl mx-auto">
            <Routes>
              <Route 
                path="/risk-analysis" 
                element={<RiskAnalysis documentInfo={documentInfo} sessionId={sessionId} />} 
              />
              <Route 
                path="/document-summary" 
                element={<DocumentSummarization documentInfo={documentInfo} sessionId={sessionId} />} 
              />
              <Route 
                path="/negotiation-assistant" 
                element={<NegotiationAssistant documentInfo={documentInfo} sessionId={sessionId} />} 
              />
              <Route 
                path="/chatbot" 
                element={<Chatbot documentInfo={documentInfo} sessionId={sessionId} />} 
              />
            </Routes>
          </div>
        </main>

        {/* Footer - Simplified on Mobile */}
        <footer className="bg-slate-900/60 border-t border-slate-700/50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
            <p className="text-slate-400 text-center sm:text-left">
              <span className="hidden sm:inline">Powered by Accord AI • </span>
              <span className="sm:hidden">Accord AI • </span>
              Advanced Legal Analysis
            </p>
            <p className="text-slate-500 text-center sm:text-right">
              Session: {sessionId?.substring(0, 6)}...
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RagAnalysis;
