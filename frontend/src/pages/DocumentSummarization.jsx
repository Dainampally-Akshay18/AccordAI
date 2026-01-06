// DocumentSummarization.jsx - Enhanced for Comprehensive Analysis Response
// ✨ ENHANCED: Displays missing_information and quality_warnings from backend
// ✅ ORIGINAL DARK SLATE COLOR THEME PRESERVED 100%

import React, { useState, useEffect } from 'react';
import { runDocumentSummary } from '../services/api';

// Expandable Text Component for long content (UNCHANGED)
const ExpandableText = ({ text, limit = 800 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= limit) {
    return (
      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
        {text || 'No content available'}
      </p>
    );
  }

  return (
    <div>
      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
        {expanded ? text : text.substring(0, limit) + '...'}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-purple-400 hover:text-purple-300 font-medium text-sm underline transition-colors"
      >
        {expanded ? 'Show Less ↑' : 'Read Full Content ↓'}
      </button>
    </div>
  );
};

const DocumentSummarization = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    keyPoints: true,
    financial: true,
    timeline: true,
    obligations: false,
    risks: false,
    chunks: true,
    metadata: false
  });

  const runAnalysis = async () => {
    if (!documentInfo?.document_id && !documentInfo?.document_name) {
      setError('No document information available. Please upload a document first.');
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('Performing comprehensive document analysis with enhanced AI...');

    try {
      const docId = documentInfo.document_id || documentInfo.document_name;
      console.log('📄 Starting comprehensive document summary for:', docId);
      
      const response = await runDocumentSummary(docId);
      if (response.success) {
        console.log('✅ Comprehensive document summary successful:', response.data);
        setAnalysis(response.data);
        setDebugInfo(`Comprehensive analysis complete: ${response.data.relevant_chunks?.length || 0} sections analyzed`);
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

  useEffect(() => {
    if (documentInfo && !analysis && !loading) {
      runAnalysis();
    }
  }, [documentInfo]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatSummaryText = (text) => {
  if (!text) return [];
  
  // 🔧 FIX: Handle if text is already an array
  if (Array.isArray(text)) {
    return text.map(item => String(item).trim()).filter(item => item.length > 0);
  }
  
  // 🔧 FIX: Ensure text is a string
  const textString = typeof text === 'string' ? text : String(text);
  
  return textString.split('\n\n').map(paragraph => paragraph.trim()).filter(paragraph => paragraph.length > 0);
};


  return (
    <div className="w-full max-w-none mx-auto">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Document Analysis
            </h2>
            <p className="text-slate-400">
              Complete legal document breakdown with detailed insights
            </p>
          </div>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/50 disabled:hover:transform-none disabled:hover:shadow-none disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Comprehensive Analysis...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
                </svg>
                <span>Generate Comprehensive Analysis</span>
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
              <h3 className="text-red-300 font-semibold mb-1">Analysis Error</h3>
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
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDelay: '150ms' }}></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Comprehensive Analysis in Progress</h3>
              <h4 className="text-xl font-bold text-white mb-2">Please Hang on Do not Click Anywhere</h4>
              <p className="text-slate-400">{debugInfo}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NEW: Quality Warnings Display (Dark Slate Theme) */}
      {analysis?.analysis?._quality_warnings && analysis.analysis._quality_warnings.length > 0 && (
        <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-300 font-semibold mb-2">⚠️ Summary Quality Notes</h3>
              <ul className="space-y-1">
                {analysis.analysis._quality_warnings.map((warning, idx) => (
                  <li key={idx} className="text-yellow-400 text-sm">• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-8">
          {/* Document Overview */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Document Overview</h3>
                <p className="text-slate-400">Contract classification and parties involved</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
                <h5 className="text-cyan-400 font-semibold mb-2">Contract Type</h5>
                <p className="text-slate-200">{analysis.analysis?.contract_type || 'Legal Agreement'}</p>
              </div>
              
              {analysis.analysis?.parties && (
                <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
                  <h5 className="text-cyan-400 font-semibold mb-2">Parties Involved</h5>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-400">Primary:</span> <span className="text-slate-200">{analysis.analysis.parties.primary_party}</span></div>
                    <div><span className="text-slate-400">Secondary:</span> <span className="text-slate-200">{analysis.analysis.parties.secondary_party}</span></div>
                    <div><span className="text-slate-400">Relationship:</span> <span className="text-slate-200">{analysis.analysis.parties.relationship}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comprehensive Summary Section */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 6.253V12L16.5 14.25M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Comprehensive Document Summary</h3>
                    <p className="text-slate-400">Complete analysis covering all important aspects</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-6">
                <div className="space-y-4">
                  {formatSummaryText(analysis.analysis?.summary || 'No summary available').map((paragraph, index) => (
                    <p key={index} className="text-slate-200 leading-relaxed text-base whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Points Section */}
          {analysis.analysis?.key_points && analysis.analysis.key_points.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-slate-700/50 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Key Contract Provisions</h3>
                    <p className="text-slate-400">Critical terms and conditions</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {analysis.analysis.key_points.map((point, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-600/50">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-green-400 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Financial Details Section */}
          {analysis.analysis?.financial_details && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2V22M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7M21 12H3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Financial Terms</h3>
                      <p className="text-slate-400">Compensation, penalties, and payment details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection('financial')}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedSections.financial ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              {expandedSections.financial && (
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(analysis.analysis.financial_details).map(([key, value]) => (
                      <div key={key} className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
                        <h5 className="text-yellow-400 font-semibold mb-2 capitalize">
                          {key.replace('_', ' ')}
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Section */}
          {analysis.analysis?.timeline && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Timeline & Milestones</h3>
                      <p className="text-slate-400">Important dates and deadlines</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection('timeline')}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedSections.timeline ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              {expandedSections.timeline && (
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(analysis.analysis.timeline).map(([key, value]) => (
                      <div key={key} className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
                        <h5 className="text-indigo-400 font-semibold mb-2 capitalize">
                          {key.replace('_', ' ')}
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Obligations Section */}
          {analysis.analysis?.obligations && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600/10 to-cyan-600/10 border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Rights & Obligations</h3>
                      <p className="text-slate-400">Responsibilities of each party</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection('obligations')}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedSections.obligations ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              {expandedSections.obligations && (
                <div className="p-6">
                  <div className="space-y-6">
                    {Object.entries(analysis.analysis.obligations).map(([key, value]) => (
                      <div key={key} className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
                        <h5 className="text-teal-400 font-semibold mb-2 capitalize">
                          {key.replace('_', ' ')}
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🆕 NEW: Missing Information Section (Dark Slate Theme) */}
          {analysis.analysis?.missing_information && analysis.analysis.missing_information.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">ℹ️ Information Not Found</h3>
                  <p className="text-slate-400">Data not present in analyzed sections</p>
                </div>
              </div>
              
              <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-3">
                  The following information was not present in the analyzed document sections:
                </p>
                <ul className="space-y-2">
                  {analysis.analysis.missing_information.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                      <span className="text-slate-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-slate-500 text-xs mt-3 italic">
                  Note: This information may exist in other parts of the document not included in the analysis.
                </p>
              </div>
            </div>
          )}
          
          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-400">{debugInfo}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Analysis State */}
      {!loading && !analysis && !error && (
        <div className="bg-slate-800/40 backdrop-blur-sm border-2 border-dashed border-slate-600/50 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h4 className="text-xl font-bold text-slate-300 mb-2">Ready for Comprehensive Analysis</h4>
          <p className="text-slate-500 max-w-lg mx-auto">
            Click "Generate Comprehensive Analysis" to create a complete document breakdown with detailed insights, financial terms, timeline, obligations, and risk analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentSummarization;
