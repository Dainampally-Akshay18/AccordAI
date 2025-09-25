// Home.jsx - Complete Tailwind CSS Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessionToken, getSessionId } from '../services/api';

const Home = () => {
  // All your existing state management
  const [sessionToken, setSessionToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Configuration
  const getApiBaseUrl = () => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_BASE_URL || 'https://accordai-mb59.onrender.com/api/v1';
    }
    if (window.REACT_APP_API_BASE_URL) {
      return window.REACT_APP_API_BASE_URL;
    }
    return 'https://accordai-mb59.onrender.com/api/v1';
  };

  const API_BASE_URL = getApiBaseUrl();
  const SUPPORTED_FORMATS = ['.pdf', '.txt', '.doc', '.docx'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  // All your existing functions remain exactly the same...
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = useCallback(async () => {
    try {
      let token = getSessionToken();
      let sessionIdValue = getSessionId();
      
      if (!token || !sessionIdValue) {
        const sessionData = await createSession();
        token = sessionData.access_token;
        sessionIdValue = sessionData.session_id;
      }
      
      setSessionToken(token);
      setSessionId(sessionIdValue);
    } catch (err) {
      setError('Failed to initialize session. Please refresh the page.');
    }
  }, []);

  const validateFile = useCallback((file) => {
    const errors = [];
    if (!file) {
      errors.push('No file selected');
      return errors;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
    const fileName = file.name.toLowerCase();
    const isValidType = SUPPORTED_FORMATS.some(format => fileName.endsWith(format));
    if (!isValidType) {
      errors.push(`Unsupported file type. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
    }
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }
    return errors;
  }, []);

  const processDocument = useCallback(async () => {
    if (!selectedFile || !sessionToken) {
      setError('Please select a file and ensure session is active');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setUploadProgress(0);

      const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf');
      
      if (isPDF) {
        setProcessingStage('🔍 Analyzing PDF with AI-powered extraction...');
        const formData = new FormData();
        formData.append('file', selectedFile);

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch(`${API_BASE_URL}/documents/upload-pdf`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          body: formData
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error(`PDF upload failed: ${await response.text()}`);
        }

        const result = await response.json();
        setProcessingResult({
          documentId: result.document_id,
          sessionDocumentId: result.session_document_id,
          chunksStored: result.chunks_stored,
          extractionInfo: result.extraction_info,
          documentSize: selectedFile.size,
          processingTime: Date.now(),
          processingMode: 'enhanced_pdf_processing'
        });

        setSuccess(true);
        setProcessingStage(`✅ PDF processed successfully! Quality: ${result.extraction_info.quality_score.toFixed(1)}/10`);
        
      } else {
        setProcessingStage('📝 Processing text document...');
        const fileContent = await readFileAsText(selectedFile);
        
        const textData = {
          document_id: `doc_${selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
          full_text: fileContent,
          chunk_size: 500,
          overlap: 100,
          document_type: 'text'
        };

        const response = await fetch(`${API_BASE_URL}/documents/store_chunks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(textData)
        });

        if (!response.ok) {
          throw new Error(`Text processing failed: ${await response.text()}`);
        }

        const result = await response.json();
        setProcessingResult({
          documentId: result.document_id,
          sessionDocumentId: result.session_document_id,
          chunksStored: result.chunks_stored,
          extractionInfo: { method: 'text_input', quality_score: 10.0 },
          documentSize: selectedFile.size,
          processingTime: Date.now(),
          processingMode: 'text_processing'
        });

        setSuccess(true);
        setProcessingStage(`✅ Text document processed successfully! ${result.chunks_stored} chunks created`);
      }

    } catch (error) {
      setError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, sessionToken, API_BASE_URL]);

  const readFileAsText = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file) => {
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    setSelectedFile(file);
    setError('');
    setSuccess(false);
    setProcessingResult(null);
  }, [validateFile]);

  const handleFileInput = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const navigateToAnalysis = useCallback(() => {
    if (processingResult) {
      localStorage.setItem('current_document', JSON.stringify({
        document_id: processingResult.documentId,
        document_name: selectedFile?.name,
        chunks_count: processingResult.chunksStored,
        processed_at: processingResult.processingTime,
        extraction_info: processingResult.extractionInfo,
        processing_mode: processingResult.processingMode
      }));
      navigate('/analysis');
    }
  }, [processingResult, selectedFile, navigate]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-5 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-5 w-80 h-80 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-2000 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 text-center">
          <div className="max-w-6xl mx-auto">
            {/* Logo */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/50 animate-float">
                <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-white">
                  <path d="M12 2L4 7L12 12L20 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="mb-8">
              <span className="block text-6xl sm:text-7xl md:text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
                Accord AI
              </span>
              <span className="block text-xl sm:text-2xl md:text-3xl font-semibold text-slate-400 tracking-wide">
                Legal Document Intelligence
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
              Transform your legal document analysis with cutting-edge AI technology. Upload contracts, agreements, and legal documents for comprehensive{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">risk assessment</span>,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">intelligent summarization</span>, and{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">negotiation assistance</span>.
            </p>

            {/* Tech Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { icon: '🤖', text: 'Llama 3.3 70B' },
                { icon: '📄', text: 'Enhanced PDF' },
                { icon: '🛡️', text: 'Secure Analysis' }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-3 px-6 py-3 bg-slate-800/60 backdrop-blur-sm border border-blue-500/30 rounded-full hover:bg-blue-600/20 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="font-semibold text-slate-200">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="py-16 px-4 bg-slate-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Upload Your Document
              </h2>
              <p className="text-xl text-slate-400">
                Drag and drop your legal document or click to browse files
              </p>
            </div>
            
            {/* Upload Zone */}
            <div 
              className={`relative w-full min-h-96 bg-slate-800/40 backdrop-blur-sm border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 mb-8 ${
                isDragging 
                  ? 'border-green-400 bg-green-500/10 scale-105' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-500/5' 
                    : isProcessing 
                      ? 'border-yellow-500 bg-yellow-500/5 cursor-not-allowed' 
                      : 'border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/5 hover:-translate-y-2'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_FORMATS.join(',')}
                onChange={handleFileInput}
                className="hidden"
                disabled={isProcessing}
              />

              {!selectedFile ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 text-blue-400 animate-bounce">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Drop your document here</h3>
                    <p className="text-xl text-slate-400">
                      or <span className="text-blue-400 font-semibold underline">click to select a file</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                    {['PDF', 'DOC', 'DOCX', 'TXT'].map((format) => (
                      <div key={format} className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                        <span className="text-2xl">📄</span>
                        <span className="text-sm font-semibold text-slate-300">{format}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-500 text-sm mt-4">Maximum file size: 50MB</p>
                </div>
              ) : (
                <div className="flex items-center gap-6 p-6 bg-slate-700/50 rounded-2xl text-left relative">
                  <div className="flex-shrink-0">
                    <div className={`w-20 h-24 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                      selectedFile.name.toLowerCase().endsWith('.pdf') 
                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                      {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">{selectedFile.name}</h3>
                    <p className="text-slate-400 mb-3">{formatFileSize(selectedFile.size)}</p>
                    {selectedFile.name.toLowerCase().endsWith('.pdf') && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-full">
                        <span>✨</span>
                        Enhanced PDF Processing
                      </span>
                    )}
                  </div>
                  <button 
                    className="absolute top-4 right-4 w-8 h-8 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setError('');
                      setSuccess(false);
                      setProcessingResult(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-4 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                <span className="text-2xl">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Process Button */}
            {selectedFile && !isProcessing && !success && (
              <button 
                className="w-full max-w-md mx-auto block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/50"
                onClick={processDocument}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <span className="text-lg">
                    {selectedFile.name.toLowerCase().endsWith('.pdf') 
                      ? 'Analyze PDF with AI' 
                      : 'Process Document'}
                  </span>
                </div>
              </button>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-600/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Processing Your Document</h3>
                    <p className="text-slate-400">{processingStage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <span className="text-blue-400 font-bold min-w-12">{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Success Status */}
            {success && processingResult && (
              <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-3xl">
                    ✅
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Document Successfully Processed! 🎉</h3>
                    <p className="text-slate-300">Your document has been analyzed with {processingResult.chunksStored} intelligent chunks.</p>
                  </div>
                </div>

                

                <button 
                  className="w-full max-w-md mx-auto block bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/50"
                  onClick={navigateToAnalysis}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">📊</span>
                    <span className="text-lg">Start Legal Analysis</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Powerful AI-Driven Analysis
              </h2>
              <p className="text-xl text-slate-400">
                Comprehensive legal document intelligence at your fingertips
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🔍',
                  title: 'Risk Analysis',
                  description: 'Identify potential legal risks, liability issues, and compliance concerns in your contracts with AI precision.'
                },
                {
                  icon: '📄',
                  title: 'Smart Summarization',
                  description: 'Get comprehensive summaries with key terms, obligations, and critical clauses highlighted automatically.'
                },
                {
                  icon: '🤝',
                  title: 'Negotiation Assistant',
                  description: 'Generate professional email templates and negotiation strategies based on contract analysis results.'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/50 p-8 rounded-2xl hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-700/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400">
            Powered by Accord AI • Enterprise-Grade Security
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${sessionToken ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-slate-400 text-sm">
              Session {sessionToken ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
