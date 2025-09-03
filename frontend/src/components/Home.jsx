// Home.jsx - Fixed Version Without Process Errors
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessionToken, getSessionId } from '../services/api';
import './Home.css';

const Home = () => {
  // State Management
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

  // ✅ FIXED: Safe environment variable access
  const getApiBaseUrl = () => {
    // Try multiple ways to get the API URL safely
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
    }
    
    // Fallback for when process is not defined
    if (window.REACT_APP_API_BASE_URL) {
      return window.REACT_APP_API_BASE_URL;
    }
    
    // Default fallback
    return 'http://localhost:8000/api/v1';
  };

  const API_BASE_URL = getApiBaseUrl();

  // Configuration Constants
  const SUPPORTED_FORMATS = ['.pdf', '.txt', '.doc', '.docx'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // Initialize Session on Mount
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
      console.log(`✅ Session initialized: ${sessionIdValue}`);
    } catch (err) {
      setError('Failed to initialize session. Please refresh the page.');
      console.error('Session initialization error:', err);
    }
  }, []);

  // File Validation
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

  // ✅ ENHANCED PDF UPLOAD - Fixed API call
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
        setProcessingStage('Uploading PDF with enhanced extraction...');
        
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Progress simulation
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        // ✅ FIXED: Safe fetch call
        const response = await fetch(`${API_BASE_URL}/documents/upload-pdf`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          },
          body: formData
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`PDF upload failed: ${errorText}`);
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
        setProcessingStage(`✅ PDF processed successfully! Quality: ${result.extraction_info.quality_score.toFixed(1)}/10, ${result.chunks_stored} chunks created`);
        
      } else {
        // Text file processing
        setProcessingStage('Processing text document...');
        
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
          const errorText = await response.text();
          throw new Error(`Text processing failed: ${errorText}`);
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
      console.error('❌ Document processing failed:', error);
      setError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, sessionToken, API_BASE_URL]);

  // Helper function to read file as text
  const readFileAsText = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  // Drag and Drop Handlers
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

  // Navigate to Analysis
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

  // File Size Formatter
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>
            <span className="logo-icon">⚖️</span>
            Enhanced Legal Document Analysis
          </h1>
          <p className="hero-subtitle">
            Upload your legal documents for comprehensive AI-powered analysis with enhanced PDF processing
          </p>
        </div>
      </div>

      <div className="upload-section">
        <div className="upload-container">
          <div 
            className={`upload-area ${isDragging ? 'dragging' : ''} ${selectedFile ? 'file-selected' : ''}`}
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
              style={{ display: 'none' }}
              disabled={isProcessing}
            />

            {!selectedFile ? (
              <div className="upload-prompt">
                <div className="upload-icon">📁</div>
                <h3>Drop your legal document here</h3>
                <p>or click to browse files</p>
                <div className="supported-formats">
                  Supported: {SUPPORTED_FORMATS.join(', ')}
                </div>
                <div className="enhanced-notice">
                  <span className="enhancement-icon">✨</span>
                  Enhanced PDF processing with quality scoring
                </div>
              </div>
            ) : (
              <div className="file-info">
                <div className="file-icon">
                  {selectedFile.name.toLowerCase().endsWith('.pdf') ? '📄' : '📝'}
                </div>
                <div className="file-details">
                  <h3>{selectedFile.name}</h3>
                  <p>{formatFileSize(selectedFile.size)}</p>
                  {selectedFile.name.toLowerCase().endsWith('.pdf') && (
                    <div className="pdf-enhancement">
                      <span className="enhancement-badge">Enhanced PDF Processing</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {selectedFile && !isProcessing && !success && (
            <button 
              className="process-button"
              onClick={processDocument}
              disabled={isProcessing}
            >
              <span>🔍</span>
              {selectedFile.name.toLowerCase().endsWith('.pdf') 
                ? 'Process PDF with Enhanced Extraction' 
                : 'Process Document'}
            </button>
          )}

          {isProcessing && (
            <div className="processing-section">
              <div className="processing-header">
                <h3>Processing Document...</h3>
                <p>{processingStage}</p>
              </div>

              <div className="progress-container">
                <div className="progress-item">
                  <label>Upload Progress:</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill upload"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            </div>
          )}

          {success && processingResult && (
            <div className="success-section">
              <div className="success-header">
                <div className="success-icon">✅</div>
                <h3>Document Processing Complete!</h3>
                <p>Your document has been processed with enhanced analysis and stored with {processingResult.chunksStored} chunks.</p>
              </div>

              <div className="success-stats">
                <div className="stat-item">
                  <span className="stat-label">Chunks Created:</span>
                  <span className="stat-value">{processingResult.chunksStored}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Processing Mode:</span>
                  <span className="stat-value">
                    {processingResult.processingMode === 'enhanced_pdf_processing' 
                      ? 'Enhanced PDF' 
                      : 'Text Processing'}
                  </span>
                </div>
                {processingResult.extractionInfo?.quality_score && (
                  <div className="stat-item">
                    <span className="stat-label">Extraction Quality:</span>
                    <span className="stat-value">
                      {processingResult.extractionInfo.quality_score.toFixed(1)}/10
                    </span>
                  </div>
                )}
              </div>

              <button 
                className="analyze-button"
                onClick={navigateToAnalysis}
              >
                <span>🎯</span>
                Start Enhanced Analysis
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <h2>Enhanced Processing Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Enhanced PDF Processing</h3>
            <p>Multi-method PDF text extraction with quality scoring and automatic fallbacks</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Llama 3.3 70B Analysis</h3>
            <p>Powered by advanced AI for superior legal document understanding</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Legal Document Chunking</h3>
            <p>Specialized chunking that preserves legal context and section boundaries</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Session Isolation</h3>
            <p>JWT-based document isolation for secure and private processing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
