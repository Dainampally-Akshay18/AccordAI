// NegotiationAssistant.jsx - Enhanced with Backend Metadata Display
// ✨ ENHANCED: Displays key_terms_addressed, negotiation_priority, quality_warnings
// ✅ YOUR ORIGINAL COLOR THEME PRESERVED 100%

import React, { useState, useEffect } from 'react';
import { runNegotiationAssistant } from '../services/api';

const NegotiationAssistant = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  const runAnalysis = async () => {
    if (!documentInfo?.document_id && !documentInfo?.document_name) {
      setError('No document information available. Please upload a document first.');
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('Generating email templates with enhanced Pinecone...');

    try {
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
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M3 8L10.89 13.26C11.5433 13.6728 12.4567 13.6728 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">
              Negotiation Email Assistant
            </h2>
            <p className="text-slate-400">
              Professional email templates for contract responses
            </p>
          </div>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/50 disabled:hover:transform-none disabled:hover:shadow-none disabled:cursor-not-allowed"
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
                  <path d="M3 8L10.89 13.26C11.5433 13.6728 12.4567 13.6728 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2"/>
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
              <div className="absolute inset-0 w-16 h-16 border-4 border-teal-500/20 border-b-teal-500 rounded-full animate-spin" style={{ animationDelay: '150ms' }}></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Generating Email Templates</h3>
              <h4 className="text-xl font-bold text-white mb-2">Please Hang on and Dont Click Anywhere</h4>
              <p className="text-slate-400">{debugInfo}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NEW: Quality Warnings Display */}
      {analysis?.analysis?._quality_warnings && analysis.analysis._quality_warnings.length > 0 && (
        <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-300 font-semibold mb-2">⚠️ Email Generation Notes</h3>
              <ul className="space-y-1">
                {analysis.analysis._quality_warnings.map((warning, idx) => (
                  <li key={idx} className="text-yellow-400 text-sm">• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NEW: Key Terms Addressed Display */}
      {analysis?.analysis?.key_terms_addressed && analysis.analysis.key_terms_addressed.length > 0 && (
        <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-blue-300 font-semibold">📋 Key Contract Terms Addressed</h3>
              <p className="text-blue-200 text-sm">The email templates address the following important contract terms:</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-16">
            {analysis.analysis.key_terms_addressed.map((term, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded-full text-sm font-medium"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 🆕 NEW: Negotiation Priority Display */}
      {analysis?.analysis?.negotiation_priority && (
        <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-purple-300 font-semibold">🎯 Priority Focus Areas</h3>
              <p className="text-purple-200 text-sm">Recommended negotiation priorities based on contract analysis</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4 ml-16">
            <p className="text-slate-200 leading-relaxed">
              {analysis.analysis.negotiation_priority}
            </p>
          </div>
        </div>
      )}

      {/* Email Templates */}
      {analysis?.analysis?.emails && (
        <div className="space-y-8">
          {/* Acceptance Email */}
          {analysis.analysis.emails.acceptance && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-green-500/50 transition-all duration-300">
              <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">✅ Acceptance Email</h3>
                      <p className="text-slate-400 text-sm">Professional acceptance template</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(analysis.analysis.emails.acceptance, 'acceptance')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/50 rounded-lg transition-all duration-300 font-semibold"
                  >
                    {copiedEmail === 'acceptance' ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M8 16H6C5.46957 16 4.96086 15.7893 4.58579 15.4142C4.21071 15.0391 4 14.5304 4 14V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H14C14.5304 4 15.0391 4.21071 15.4142 4.58579C15.7893 4.96086 16 5.46957 16 6V8M10 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V10C20 9.46957 19.7893 8.96086 19.4142 8.58579C19.0391 8.21071 18.5304 8 18 8H10C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10V18C8 18.5304 8.21071 19.0391 8.58579 19.4142C8.96086 19.7893 9.46957 20 10 20Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Copy Email
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-6">
                  <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {analysis.analysis.emails.acceptance}
                  </pre>
                </div>
                <p className="text-slate-400 text-sm mt-4 italic">
                  💡 Use this template when you're ready to accept the contract with positive terms. Customize as needed before sending.
                </p>
              </div>
            </div>
          )}

          {/* Rejection/Negotiation Email */}
          {analysis.analysis.emails.rejection && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300">
              <div className="bg-gradient-to-r from-orange-600/10 to-red-600/10 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">⚠️ Negotiation/Rejection Email</h3>
                      <p className="text-slate-400 text-sm">Professional rejection template</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(analysis.analysis.emails.rejection, 'rejection')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/50 rounded-lg transition-all duration-300 font-semibold"
                  >
                    {copiedEmail === 'rejection' ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M8 16H6C5.46957 16 4.96086 15.7893 4.58579 15.4142C4.21071 15.0391 4 14.5304 4 14V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H14C14.5304 4 15.0391 4.21071 15.4142 4.58579C15.7893 4.96086 16 5.46957 16 6V8M10 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V10C20 9.46957 19.7893 8.96086 19.4142 8.58579C19.0391 8.21071 18.5304 8 18 8H10C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10V18C8 18.5304 8.21071 19.0391 8.58579 19.4142C8.96086 19.7893 9.46957 20 10 20Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Copy Email
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-6">
                  <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {analysis.analysis.emails.rejection}
                  </pre>
                </div>
                <p className="text-slate-400 text-sm mt-4 italic">
                  💡 Use this template when you need to negotiate terms or decline the offer. It maintains professionalism while addressing concerns.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      {debugInfo && analysis && (
        <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4 mt-8">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-400">{debugInfo}</span>
          </div>
        </div>
      )}

      {/* No Analysis State */}
      {!loading && !analysis && !error && (
        <div className="bg-slate-800/40 backdrop-blur-sm border-2 border-dashed border-slate-600/50 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path d="M3 8L10.89 13.26C11.5433 13.6728 12.4567 13.6728 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h4 className="text-xl font-bold text-slate-300 mb-2">Ready to Generate Email Templates</h4>
          <p className="text-slate-500">Click the "Generate Email Templates" button to create professional response emails.</p>
        </div>
      )}
    </div>
  );
};

export default NegotiationAssistant;
