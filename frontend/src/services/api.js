// api.js - Fixed API Paths and Error Handling
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout for analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'access_token';

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
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

// Session management
export const createSession = async () => {
  try {
    console.log('🔐 Creating new session...');
    const response = await api.post('/auth/create-session', {
      client_info: 'web_client'
    });
    const { access_token, session_id } = response.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem('session_id', session_id);
    console.log('✅ Session created successfully');
    return { access_token, session_id };
  } catch (error) {
    console.error('❌ Create session error:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create session');
  }
};

export const getSessionToken = () => localStorage.getItem(TOKEN_KEY);
export const getSessionId = () => localStorage.getItem('session_id');

// Document management
export const storeDocumentChunks = async (documentData) => {
  try {
    console.log('📄 Storing document chunks...');
    const response = await api.post('/documents/store_chunks', documentData);
    console.log('✅ Document chunks stored successfully');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Store chunks error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Failed to store document' 
    };
  }
};

// ✅ FIXED: Analysis API calls with exact backend paths
export const runRiskAnalysis = async (documentId, jurisdiction = 'US') => {
  try {
    console.log(`🎯 Running risk analysis for document: ${documentId}`);
    const response = await api.post('/analysis/risk-analysis', {
      document_id: documentId,
      jurisdiction
    });
    console.log('✅ Risk analysis completed');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Risk analysis error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Risk analysis failed' 
    };
  }
};

export const runNegotiationAssistant = async (documentId, jurisdiction = 'US') => {
  try {
    console.log(`🤝 Running negotiation assistant for document: ${documentId}`);
    const response = await api.post('/analysis/negotiation-assistant', {
      document_id: documentId,
      jurisdiction
    });
    console.log('✅ Negotiation assistant completed');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Negotiation assistant error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Negotiation assistance failed' 
    };
  }
};

export const runDocumentSummary = async (documentId, jurisdiction = 'US') => {
  try {
    console.log(`📄 Running document summary for document: ${documentId}`);
    const response = await api.post('/analysis/document-summary', {
      document_id: documentId,
      jurisdiction
    });
    console.log('✅ Document summary completed');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Document summary error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Document summary failed' 
    };
  }
};

// Legacy endpoint (for backward compatibility)
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

// Validation and session info
export const validateToken = async () => {
  try {
    const response = await api.post('/auth/validate-token');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Token validation failed'
    };
  }
};

export const getSessionInfo = async () => {
  try {
    const response = await api.get('/auth/session-info');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to get session info'
    };
  }
};

export default api;
