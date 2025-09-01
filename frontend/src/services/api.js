// api.js - Updated with New Endpoints
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'access_token';

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      try {
        await createSession();
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

// Existing functions
export const createSession = async () => {
  try {
    const response = await api.post('/auth/create-session', {
      client_info: 'web_client'
    });
    const { access_token, session_id } = response.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem('session_id', session_id);
    return { access_token, session_id };
  } catch (error) {
    console.error('Create session error:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create session');
  }
};

export const getSessionToken = () => localStorage.getItem(TOKEN_KEY);
export const getSessionId = () => localStorage.getItem('session_id');

export const storeDocumentChunks = async (documentData) => {
  try {
    const response = await api.post('/documents/store_chunks', documentData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Store chunks error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Failed to store document' 
    };
  }
};

// ✅ NEW: Specialized Analysis Endpoints
export const runRiskAnalysis = async (documentId, jurisdiction = 'US') => {
  try {
    const response = await api.post('/analysis/risk-analysis', {
      document_id: documentId,
      jurisdiction
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Risk analysis error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Risk analysis failed' 
    };
  }
};

export const runNegotiationAssistant = async (documentId, jurisdiction = 'US') => {
  try {
    const response = await api.post('/analysis/negotiation-assistant', {
      document_id: documentId,
      jurisdiction
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Negotiation assistant error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Negotiation assistance failed' 
    };
  }
};

export const runDocumentSummary = async (documentId, jurisdiction = 'US') => {
  try {
    const response = await api.post('/analysis/document-summary', {
      document_id: documentId,
      jurisdiction
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Document summary error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Document summary failed' 
    };
  }
};

// Legacy endpoint (keep for backward compatibility)
export const runRagAnalysis = async (analysisData) => {
  try {
    const response = await api.post('/analysis/rag_analysis', analysisData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Analysis failed' 
    };
  }
};

export default api;
