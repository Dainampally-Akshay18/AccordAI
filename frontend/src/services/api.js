// api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'access_token';

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(TOKEN_KEY);
      // Try to create a new session
      try {
        await createSession();
        // Retry the original request
        const originalRequest = error.config;
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (sessionError) {
        console.error('Failed to create new session:', sessionError);
      }
    }
    return Promise.reject(error);
  }
);

// 1. Create Session (Get JWT Token from Backend)
export const createSession = async () => {
  try {
    const response = await api.post('/auth/create-session', {
      client_info: 'web_client'
    });
    
    const { access_token, session_id } = response.data;
    
    // Store token
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem('session_id', session_id);
    
    return {
      access_token,
      session_id
    };
  } catch (error) {
    console.error('Create session error:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create session');
  }
};

// Get current session token
export const getSessionToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get current session ID
export const getSessionId = () => {
  return localStorage.getItem('session_id');
};

// 2. Store Document Chunks
export const storeDocumentChunks = async (documentData) => {
  try {
    const response = await api.post('/documents/store_chunks', documentData);
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('Store chunks error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to store document'
    };
  }
};

// 3. Call RAG Analysis API
export const runRagAnalysis = async (analysisData) => {
  try {
    const response = await api.post('/analysis/rag_analysis', analysisData);
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('RAG analysis error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || 'Analysis failed'
    };
  }
};

// 4. Validate Token
export const validateToken = async () => {
  try {
    const response = await api.post('/auth/validate-token');
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Token validation failed'
    };
  }
};

// 5. Get Session Info
export const getSessionInfo = async () => {
  try {
    const response = await api.get('/auth/session-info');
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to get session info'
    };
  }
};

export default api;
    