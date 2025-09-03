// NegotiationAssistant.jsx - Complete Fix
import React, { useState, useEffect } from 'react';
import { runNegotiationAssistant } from '../services/api';

const NegotiationAssistant = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  const runAnalysis = async () => {
    // Fixed: Check for document_id properly
    if (!documentInfo?.document_id && !documentInfo?.document_name) {
      setError('No document information available. Please upload a document first.');
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('Generating email templates with enhanced Pinecone...');

    try {
      // Use document_id if available, otherwise try document_name
      const docId = documentInfo.document_id || documentInfo.document_name;
      console.log('🤝 Starting negotiation analysis for:', docId);
      
      const response = await runNegotiationAssistant(docId);

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
    if (documentInfo && !analysis && !loading) {
      runAnalysis();
    }
  }, [documentInfo]);

  const copyToClipboard = async (text, emailType) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(emailType);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedEmail(emailType);
        setTimeout(() => setCopiedEmail(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        alert('Failed to copy email to clipboard');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="w-full max-w-none mx-auto">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M17 3C18.6569 3 20 4.34315 20 6C20 7.65685 18.6569 9 17 9C15.3431 9 14 7.65685 14 6C14 4.34315 15.3431 3 17 3ZM17 3V12L12 17L7 12V3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Negotiation Assistant
            </h2>
            <p className="text-slate-400">
              Professional email templates for contract responses
            </p>
          </div>
        </div>

        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/50 disabled:hover:transform-none disabled:hover:shadow-none disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating Templates...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Generate Email Templates</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Generation Error</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 border-b-blue-500 rounded-full animate-spin" style={{ animationDelay: '150ms' }}></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Crafting Email Templates</h3>
              <p className="text-slate-400">{debugInfo}</p>
            </div>
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Email Templates */}
      {analysis && (
        <div className="space-y-8">
          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
          </div>

          {/* Email Templates Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Acceptance Email */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Acceptance Email</h3>
                      <p className="text-green-300 text-sm">Professional acceptance template</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(analysis.analysis?.emails?.acceptance, 'acceptance')}
                    className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-500/50 text-green-300 hover:text-white px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      {copiedEmail === 'acceptance' ? (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-sm font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-sm font-medium">Copy</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Email Content */}
              <div className="p-6">
                <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-6 min-h-80">
                  <textarea 
                    className="w-full h-full min-h-72 bg-transparent border-none resize-none text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                    value={analysis.analysis?.emails?.acceptance || 'Acceptance email template not available'}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Rejection Email */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Rejection Email</h3>
                      <p className="text-red-300 text-sm">Professional rejection template</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(analysis.analysis?.emails?.rejection, 'rejection')}
                    className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-white px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      {copiedEmail === 'rejection' ? (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-sm font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-sm font-medium">Copy</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Email Content */}
              <div className="p-6">
                <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-6 min-h-80">
                  <textarea 
                    className="w-full h-full min-h-72 bg-transparent border-none resize-none text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                    value={analysis.analysis?.emails?.rejection || 'Rejection email template not available'}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          
        </div>
      )}

      {/* No Analysis State */}
      {!loading && !analysis && !error && (
        <div className="bg-slate-800/40 backdrop-blur-sm border-2 border-dashed border-slate-600/50 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h4 className="text-xl font-bold text-slate-300 mb-2">Ready to Generate Templates</h4>
          <p className="text-slate-500">Click the "Generate Email Templates" button to create professional response emails.</p>
        </div>
      )}
    </div>
  );
};

export default NegotiationAssistant;
