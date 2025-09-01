import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession, uploadDocument } from '../services/api'
import './Home.css'

const Home = () => {
  const [sessionToken, setSessionToken] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [uploadMode, setUploadMode] = useState('text')
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  // Function to refresh session token
  const refreshSession = async () => {
    try {
      const response = await createSession()
      setSessionToken(response.session_token)
      localStorage.setItem('session_token', response.session_token)
      return response.session_token
    } catch (err) {
      setError('Failed to refresh session')
      throw err
    }
  }

  // Create session on component mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await createSession()
        setSessionToken(response.session_token)
        localStorage.setItem('session_token', response.session_token)
      } catch (err) {
        setError('Failed to create session')
      }
    }

    const existingToken = localStorage.getItem('session_token')
    if (existingToken) {
      setSessionToken(existingToken)
    } else {
      initSession()
    }
  }, [])

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFileType(droppedFile)) {
        setFile(droppedFile)
        setError('')
        setResult(null)
        setUploadMode('file')
      } else {
        setError('Please upload a valid file type (.txt, .doc, .docx, .pdf)')
      }
    }
  }

  const validateFileType = (file) => {
    const allowedTypes = ['.txt', '.doc', '.docx', '.pdf']
    const fileName = file.name.toLowerCase()
    return allowedTypes.some(type => fileName.endsWith(type))
  }

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && validateFileType(selectedFile)) {
      setFile(selectedFile)
      setError('')
      setResult(null)
    } else {
      setError('Please select a valid file type (.txt, .doc, .docx, .pdf)')
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    setError('')
    setResult(null)
  }

  const simulateProgress = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)
    return interval
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!sessionToken) {
      setError('No session available. Please refresh the page.')
      return
    }

    if (uploadMode === 'text' && !text.trim()) {
      setError('Please enter some text')
      return
    }

    if (uploadMode === 'file' && !file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    
    const progressInterval = simulateProgress()
    let currentToken = sessionToken

    try {
      let textContent = text
      let documentId = `text_${Date.now()}`
      
      if (uploadMode === 'file') {
        textContent = await readFileAsText(file)
        documentId = `file_${file.name}_${Date.now()}`
      }

      // Try with current token first
      let response = await uploadDocument({
        full_text: textContent,
        document_id: documentId,
        chunk_size: 800,
        overlap: 100
      }, currentToken)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setTimeout(() => {
        setResult(response)
        setText('')
        setFile(null)
        setUploadProgress(0)
      }, 500)

    } catch (err) {
      // Handle token refresh if needed
      if (err.message.includes('401') || err.message.includes('expired')) {
        try {
          console.log('Token expired, refreshing...')
          currentToken = await refreshSession()
          
          let textContent = text
          let documentId = `text_${Date.now()}`
          
          if (uploadMode === 'file') {
            textContent = await readFileAsText(file)
            documentId = `file_${file.name}_${Date.now()}`
          }

          const response = await uploadDocument({
            full_text: textContent,
            document_id: documentId,
            chunk_size: 800,
            overlap: 100
          }, currentToken)

          clearInterval(progressInterval)
          setUploadProgress(100)

          setTimeout(() => {
            setResult(response)
            setText('')
            setFile(null)
            setUploadProgress(0)
          }, 500)

        } catch (refreshErr) {
          clearInterval(progressInterval)
          setUploadProgress(0)
          setError('Session expired and failed to refresh. Please reload the page.')
        }
      } else {
        clearInterval(progressInterval)
        setUploadProgress(0)
        setError(err.message || 'Failed to upload document')
      }
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }
  }

  // RAG Analysis redirect handler - SIMPLIFIED
  const handleRagAnalysis = () => {
    if (!result || !result.document_id) {
      setError('No document uploaded to analyze. Please upload a document first.')
      return
    }

    // Store document data for the analysis page
    localStorage.setItem('current_document', JSON.stringify({
      document_id: result.document_id,
      document_name: uploadMode === 'file' ? file?.name || 'Unknown File' : 'Text Document',
      upload_mode: uploadMode,
      chunks_stored: result.chunks_stored,
      timestamp: result.timestamp
    }))

    // Redirect to analysis page WITHOUT documentId in URL
    navigate('/analysis')
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Legal Document Analysis Platform</h1>
        <p>Upload your legal documents and get AI-powered insights</p>
      </div>

      <div className="upload-section">
        <div className="upload-tabs">
          <button 
            className={`tab-button ${uploadMode === 'text' ? 'active' : ''}`}
            onClick={() => {
              setUploadMode('text')
              setFile(null)
              setError('')
            }}
          >
            📄 Text Input
          </button>
          <button 
            className={`tab-button ${uploadMode === 'file' ? 'active' : ''}`}
            onClick={() => {
              setUploadMode('file')
              setText('')
              setError('')
            }}
          >
            📁 File Upload
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {uploadMode === 'text' ? (
            <div className="text-input-section">
              <label htmlFor="text-input">Paste your legal document text:</label>
              <textarea
                id="text-input"
                value={text}
                onChange={handleTextChange}
                placeholder="Paste your legal document content here..."
                rows="12"
                className="text-input"
              />
            </div>
          ) : (
            <div className="file-input-section">
              <div
                className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.doc,.docx,.pdf"
                  style={{ display: 'none' }}
                />
                
                {file ? (
                  <div className="file-info">
                    <div className="file-icon">📎</div>
                    <div className="file-details">
                      <p className="file-name">{file.name}</p>
                      <p className="file-size">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      className="remove-file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <div className="upload-icon">📤</div>
                    <p>Drag and drop your file here, or click to select</p>
                    <p className="file-types">Supported: .txt, .doc, .docx, .pdf</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>Uploading and processing... {Math.round(uploadProgress)}%</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!text.trim() && !file)}
            className="upload-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <span>🚀</span>
                Upload Document
              </>
            )}
          </button>
        </form>

        {/* Upload Success Section */}
        {result && (
          <div className="upload-success">
            <div className="success-card">
              <div className="success-header">
                <span className="success-icon">✅</span>
                <h3>Document Uploaded Successfully!</h3>
              </div>
              
              <div className="success-details">
                <p><strong>Document ID:</strong> {result.document_id}</p>
                <p><strong>Chunks Stored:</strong> {result.chunks_stored}</p>
                <p><strong>Status:</strong> {result.status}</p>
                <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
              </div>

              {/* RAG Analysis Button - Only shows after successful upload */}
              <div className="analysis-section">
                <h4>🔍 Ready for Analysis</h4>
                <p>Your document has been processed and is ready for AI analysis.</p>
                <button
                  onClick={handleRagAnalysis}
                  className="rag-analysis-button"
                >
                  <span>🤖</span>
                  Start RAG Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
