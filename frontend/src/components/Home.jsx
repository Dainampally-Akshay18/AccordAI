// Home.jsx - Fixed Chunking and Storage Logic
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, storeDocumentChunks, getSessionToken, getSessionId } from '../services/api';
import './Home.css';

const Home = () => {
  // State Management
  const [sessionToken, setSessionToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [chunkingProgress, setChunkingProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [processedChunks, setProcessedChunks] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);
  const [chunkDetails, setChunkDetails] = useState([]);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Configuration Constants
  const CHUNK_SIZE = 800; // words per chunk
  const CHUNK_OVERLAP = 100; // overlapping words
  const SUPPORTED_FORMATS = ['.txt', '.doc', '.docx', '.pdf', '.md'];
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
      
    } catch (err) {
      setError('Failed to initialize session. Please refresh the page.');
      console.error('Session initialization error:', err);
    }
  }, []);

  // Advanced Text Chunking with Overlap
  const chunkText = useCallback((text) => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const chunks = [];
    const step = CHUNK_SIZE - CHUNK_OVERLAP;
    
    for (let i = 0; i < words.length; i += step) {
      const chunkWords = words.slice(i, i + CHUNK_SIZE);
      if (chunkWords.length === 0) break;
      
      const chunkText = chunkWords.join(' ');
      chunks.push({
        index: Math.floor(i / step),
        text: chunkText,
        wordCount: chunkWords.length,
        startWord: i,
        endWord: Math.min(i + CHUNK_SIZE - 1, words.length - 1)
      });
      
      // Update chunking progress
      const progress = Math.min(100, Math.round(((i + CHUNK_SIZE) / words.length) * 100));
      setChunkingProgress(progress);
      
      // Break if we've covered all words
      if (i + CHUNK_SIZE >= words.length) break;
    }
    
    console.log(`📄 Created ${chunks.length} chunks from ${words.length} words`);
    return chunks;
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

  // File Content Reader
  const readFileContent = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const timeoutId = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout'));
      }, 30000);

      reader.onload = (event) => {
        clearTimeout(timeoutId);
        resolve(event.target.result);
      };

      reader.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('File reading failed'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  // ✅ FIXED: Store all chunks as one document with proper structure
  const storeAllChunksAsDocument = useCallback(async (chunks, documentId) => {
    // Create the full text by combining all chunks
    const fullText = chunks.map(chunk => chunk.text).join('\n\n');
    
    const documentData = {
      document_id: documentId, // Base document ID without chunk suffix
      full_text: fullText,
      chunk_size: CHUNK_SIZE,
      overlap: CHUNK_OVERLAP
    };

    console.log(`📤 Storing document with ${chunks.length} chunks as single document: ${documentId}`);
    
    const response = await storeDocumentChunks(documentData);
    
    if (!response.success) {
      throw new Error(`Failed to store document: ${response.error}`);
    }

    return {
      documentId,
      totalChunks: chunks.length,
      apiResponse: response.data
    };
  }, []);

  // Main Document Processing Function
  const processDocument = useCallback(async () => {
    if (!selectedFile || !sessionToken) {
      setError('Please select a file and ensure session is active');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setChunkingProgress(0);
      setUploadProgress(0);
      setProcessedChunks(0);
      setTotalChunks(0);
      setChunkDetails([]);

      // Stage 1: Read file content
      setProcessingStage('Reading file content...');
      const fileContent = await readFileContent(selectedFile);
      console.log(`📖 File read: ${fileContent.length} characters`);

      // Stage 2: Chunk the document
      setProcessingStage('Breaking document into chunks...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Allow UI update
      
      const chunks = chunkText(fileContent);
      setTotalChunks(chunks.length);
      
      if (chunks.length === 0) {
        throw new Error('No chunks generated from document');
      }

      console.log(`🔍 Document chunked into ${chunks.length} pieces`);

      // Stage 3: Generate document ID (base ID, no chunk suffix)
      const documentId = `doc_${selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      // Stage 4: Store all chunks as one document
      setProcessingStage('Storing document in database...');
      setUploadProgress(50);
      
      const result = await storeAllChunksAsDocument(chunks, documentId);
      
      setUploadProgress(100);
      setProcessedChunks(chunks.length);
      
      // Stage 5: Success
      setProcessingResult({
        documentId,
        originalDocumentId: documentId,
        chunksStored: chunks.length,
        documentSize: selectedFile.size,
        processingTime: Date.now(),
        chunkDetails: chunks.map((chunk, index) => ({
          chunkIndex: index,
          chunkId: `${documentId}_chunk_${index}`,
          wordCount: chunk.wordCount
        }))
      });
      
      setChunkDetails(chunks.map((chunk, index) => ({
        chunkIndex: index,
        chunkId: `${documentId}_chunk_${index}`,
        wordCount: chunk.wordCount
      })));
      
      setSuccess(true);
      setProcessingStage(`✅ Successfully processed document with ${chunks.length} chunks!`);
      
      console.log(`🎉 Document processing completed: ${chunks.length} chunks in 1 document`);
      
    } catch (error) {
      console.error('❌ Document processing failed:', error);
      setError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, sessionToken, readFileContent, chunkText, storeAllChunksAsDocument]);

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
    setChunkDetails([]);
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
        document_id: processingResult.originalDocumentId,
        document_name: selectedFile?.name,
        chunks_count: processingResult.chunksStored,
        processed_at: processingResult.processingTime,
        chunk_details: processingResult.chunkDetails
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
      {/* Animated Background */}
      <div className="background-overlay">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Two-Column Layout Container */}
      <div className="layout-container">
        
        {/* LEFT COLUMN - Main Content */}
        <div className="left-column">
          <div className="main-content">
            {/* Header */}
            <header className="page-header">
              <div className="header-content">
                <h1 className="main-title">
                  <span className="title-icon">📄</span>
                  Legal Document Processor
                </h1>
                <p className="subtitle">
                  Advanced AI-powered document analysis with intelligent chunking
                </p>
              </div>
            </header>

            {/* Main Interface */}
            <div className="processing-interface">
              
              {/* File Upload Section */}
              <div className="upload-section">
                <div 
                  className={`upload-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={SUPPORTED_FORMATS.join(',')}
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                  />
                  
                  {selectedFile ? (
                    <div className="file-preview">
                      <div className="file-icon">
                        <span className="file-type">{selectedFile.name.split('.').pop()?.toUpperCase()}</span>
                      </div>
                      <div className="file-details">
                        <h3 className="file-name">{selectedFile.name}</h3>
                        <div className="file-meta">
                          <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                          <span className="file-status">Ready to process</span>
                        </div>
                      </div>
                      <button 
                        className="remove-file"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setError('');
                          setSuccess(false);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <div className="upload-icon">📁</div>
                      <h3>Drop your document here</h3>
                      <p>or click to browse files</p>
                      <div className="supported-formats">
                        <small>Supported: {SUPPORTED_FORMATS.join(', ')}</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="controls-section">
                <button
                  className={`process-btn ${!selectedFile || isProcessing ? 'disabled' : 'active'}`}
                  onClick={processDocument}
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="process-icon">⚡</span>
                      Process Document
                    </>
                  )}
                </button>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="processing-status">
                  <div className="status-header">
                    <h4>{processingStage}</h4>
                    <span className="status-indicator"></span>
                  </div>
                  
                  <div className="progress-section">
                    {totalChunks > 0 && (
                      <>
                        <div className="progress-item">
                          <label>Chunking Progress</label>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${chunkingProgress}%` }}
                            ></div>
                          </div>
                          <span>{chunkingProgress}%</span>
                        </div>

                        <div className="progress-item">
                          <label>Upload Progress</label>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <span>{uploadProgress}%</span>
                        </div>
                      </>
                    )}
                  </div>

                  {totalChunks > 0 && (
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Total Chunks</span>
                        <span className="stat-value">{totalChunks}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Processing</span>
                        <span className="stat-value">Single Document</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Status</span>
                        <span className="stat-value">Processing</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="notification error">
                  <div className="notification-icon">⚠️</div>
                  <div className="notification-content">
                    <h4>Processing Error</h4>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Success Display */}
              {success && processingResult && (
                <div className="notification success">
                  <div className="notification-icon">✅</div>
                  <div className="notification-content">
                    <h4>Document Processed Successfully!</h4>
                    <p>Your document has been processed and stored with {processingResult.chunksStored} chunks for optimal RAG analysis.</p>
                    
                    <div className="result-stats">
                      <div className="result-item">
                        <span>Document ID:</span>
                        <span>{processingResult.originalDocumentId}</span>
                      </div>
                      <div className="result-item">
                        <span>Total Chunks:</span>
                        <span>{processingResult.chunksStored}</span>
                      </div>
                      <div className="result-item">
                        <span>File Size:</span>
                        <span>{formatFileSize(processingResult.documentSize)}</span>
                      </div>
                      <div className="result-item">
                        <span>Storage Method:</span>
                        <span>Unified Document</span>
                      </div>
                    </div>

                    {/* Chunk Details */}
                    <div className="chunk-summary">
                      <h5>📊 Chunk Details:</h5>
                      <div className="chunk-grid">
                        {chunkDetails.slice(0, 3).map((chunk, index) => (
                          <div key={index} className="chunk-card">
                            <div className="chunk-header">
                              <span className="chunk-number">#{chunk.chunkIndex + 1}</span>
                              <span className="chunk-words">{chunk.wordCount} words</span>
                            </div>
                            <div className="chunk-id">Ready for Analysis</div>
                          </div>
                        ))}
                        {chunkDetails.length > 3 && (
                          <div className="chunk-card more-chunks">
                            <div className="more-indicator">
                              +{chunkDetails.length - 3} more chunks
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      className="analyze-btn"
                      onClick={navigateToAnalysis}
                    >
                      <span className="analyze-icon">🔍</span>
                      Start AI Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Session Footer */}
            <footer className="session-footer">
              <div className="session-indicator">
                <div className={`session-dot ${sessionToken ? 'active' : 'inactive'}`}></div>
                <span>Session: {sessionId ? `Active (${sessionId.substring(0, 8)}...)` : 'Inactive'}</span>
              </div>
              <div className="security-badge">
                <span className="security-icon">🔒</span>
                <span>JWT Authentication Enabled</span>
              </div>
            </footer>
          </div>
        </div>

        {/* RIGHT COLUMN - Information Panel */}
        <div className="right-column">
          <div className="info-panel">
            
            {/* AI Processing Showcase */}
            <div className="showcase-section">
              <div className="showcase-icon">
                <div className="ai-brain">
                  <div className="brain-pulse"></div>
                  🧠
                </div>
              </div>
              <h2>Optimized Document Processing</h2>
              <p>Documents are intelligently chunked and stored as unified documents for superior RAG retrieval performance.</p>
            </div>

            {/* Chunking Process */}
            <div className="process-section">
              <h3>🔄 Processing Method</h3>
              <div className="process-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <span>Read & Chunk</span>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <span className="step-number">2</span>
                  <span>Unified Storage</span>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <span className="step-number">3</span>
                  <span>RAG Ready</span>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="features-section">
              <h3>✨ Key Features</h3>
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <div>
                    <strong>Smart Chunking</strong>
                    <p>Word-based chunking with overlap for context preservation</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📋</span>
                  <div>
                    <strong>Unified Storage</strong>
                    <p>All chunks stored as one document for optimal retrieval</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔐</span>
                  <div>
                    <strong>Session Isolation</strong>
                    <p>JWT-based document isolation for secure processing</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔍</span>
                  <div>
                    <strong>RAG Optimized</strong>
                    <p>Structured for efficient semantic search and analysis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Info */}
            <div className="config-section">
              <h3>⚙️ Configuration</h3>
              <div className="config-grid">
                <div className="config-item">
                  <span className="config-label">Chunk Size</span>
                  <span className="config-value">{CHUNK_SIZE} words</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Overlap</span>
                  <span className="config-value">{CHUNK_OVERLAP} words</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Max File Size</span>
                  <span className="config-value">50 MB</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
