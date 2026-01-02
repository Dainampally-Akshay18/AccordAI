// api.js - Updated with Chatbot API calls
import axios from "axios";

// Config
const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL ||
  window?.REACT_APP_API_BASE_URL ||
  "https://accordai-mb59.onrender.com/api/v1";

const TOKEN_KEY = "access_token";
const SESSION_ID_KEY = "session_id";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// JWT helpers
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const data = parseJwt(token);
  if (!data?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return data.exp <= now;
}

// Interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);


export const initializeSession = async () => {
  if (__init_inflight) return __init_inflight;

  const existingToken = localStorage.getItem(TOKEN_KEY);

  // Check if token exists and is still valid
  if (existingToken && !isTokenExpired(existingToken)) {
    console.log("✅ Valid session found, skipping initialization");
    return { 
      access_token: existingToken, 
      session_id: localStorage.getItem(SESSION_ID_KEY) 
    };
  }

  console.log("🚀 Session missing or expired. Initializing new session...");
  
  __init_inflight = (async () => {
    try {
      const { access_token, session_id } = await createSession();
      return { access_token, session_id };
    } catch (error) {
      console.error("Fatal: Could not initialize session.", error);
    } finally {
      __init_inflight = null;
    }
  })();
  
  return __init_inflight;
};

export const createSession = async () => {
  try {
    const response = await api.post("/auth/create-session", {
      client_info: "web_client",
    });
    const { access_token, session_id } = response.data || {};
    
    if (access_token) localStorage.setItem(TOKEN_KEY, access_token);
    if (session_id) localStorage.setItem(SESSION_ID_KEY, session_id);
    
    return { access_token, session_id };
  } catch (error) {
    throw new Error(error?.response?.data?.detail || "Failed to create session");
  }
};
export const getSessionToken = () => localStorage.getItem(TOKEN_KEY);
export const getSessionId = () => localStorage.getItem(SESSION_ID_KEY);

// Document APIs
export const storeDocumentChunks = async (documentData) => {
  try {
    const resp = await api.post("/documents/store-chunks", documentData);
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Failed to store document",
    };
  }
};

// Analysis APIs
export const runRiskAnalysis = async (documentId, jurisdiction = "US") => {
  try {
    const resp = await api.post("/analysis/risk-analysis", {
      document_id: documentId,
      jurisdiction,
    });
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error:
        err?.response?.data?.detail ||
        err?.message ||
        "Risk analysis failed",
    };
  }
};

export const runNegotiationAssistant = async (
  documentId,
  jurisdiction = "US"
) => {
  try {
    const resp = await api.post("/analysis/negotiation-assistant", {
      document_id: documentId,
      jurisdiction,
    });
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error:
        err?.response?.data?.detail ||
        err?.message ||
        "Negotiation assistance failed",
    };
  }
};

export const runDocumentSummary = async (documentId, jurisdiction = "US") => {
  try {
    const resp = await api.post("/analysis/document-summary", {
      document_id: documentId,
      jurisdiction,
    });
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error:
        err?.response?.data?.detail ||
        err?.message ||
        "Document summary failed",
    };
  }
};

export const runRagAnalysis = async (analysisData) => {
  try {
    const resp = await api.post("/analysis/rag-analysis", analysisData);
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Analysis failed",
    };
  }
};

// ✅ NEW: Chatbot APIs
export const sendChatMessage = async (chatData) => {
  try {
    console.log("💬 Sending chat message:", chatData);
    const resp = await api.post("/chatbot/chat", chatData);
    return { success: true, data: resp.data };
  } catch (err) {
    console.error("Chat error:", err);
    return {
      success: false,
      error: err?.response?.data?.detail || "Chat failed",
    };
  }
};

export const getChatHistory = async () => {
  try {
    const resp = await api.get("/chatbot/conversation/history");
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Failed to get chat history",
    };
  }
};

export const getChatSummary = async () => {
  try {
    const resp = await api.get("/chatbot/conversation/summary");
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Failed to get chat summary",
    };
  }
};

export const clearChatHistory = async () => {
  try {
    const resp = await api.delete("/chatbot/conversation/clear");
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Failed to clear chat",
    };
  }
};

export const getChatbotHealth = async () => {
  try {
    const resp = await api.get("/chatbot/health");
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Health check failed",
    };
  }
};

// Auth APIs
export const validateToken = async () => {
  try {
    const resp = await api.post("/auth/validate-token");
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Token validation failed",
    };
  }
};

export const getSessionInfo = async () => {
  try {
    const resp = await api.get("/auth/session-info");
    return { success: true, data: resp.data };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.detail || "Failed to get session info",
    };
  }
};

export default api;
