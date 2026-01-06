// frontend/src/services/api.js
import axios from "axios";
import { auth } from "../utils/firebase"; // Ensure this file exists!

// Config
const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL ||
  window?.REACT_APP_API_BASE_URL ||
  "http://localhost:8000/api/v1";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// --- Security Interceptor ---
// Automatically attaches the Firebase ID Token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // getIdToken() returns a valid JWT, refreshing it if necessary
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching Firebase token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// --- Session Management ---

export const initializeSession = async () => {
  // With Firebase, "session" is handled by the Auth Provider.
  // We just check if we can reach the backend.
  try {
    // Wait a moment for Firebase to initialize auth state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!auth.currentUser) {
      console.log("Waiting for user login...");
      return null;
    }

    // Optional: Validate token with backend to ensure user exists there
    const validation = await validateToken();
    return validation.data;
  } catch (error) {
    console.warn("Session check failed (user might be logged out):", error);
    return null;
  }
};

export const getSessionToken = async () => {
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
};

export const getSessionId = () => {
    // In Firebase, the UID is the permanent session ID
    return auth.currentUser ? auth.currentUser.uid : null;
};

// --- Document APIs ---

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

// --- Analysis APIs ---

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

// --- Chatbot APIs ---

export const sendChatMessage = async (chatData) => {
  try {
    // console.log("💬 Sending chat message:", chatData);
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

// --- Auth APIs ---

export const validateToken = async () => {
  try {
    const resp = await api.get("/auth/validate-token"); // Changed to GET as per updated backend
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

// Backend Login Trigger (Optional)
// Use this if you want to explicitly register the user in your DB after Firebase login
export const backendLogin = async () => {
  try {
    const token = await auth.currentUser.getIdToken();
    const resp = await api.post("/auth/login", { id_token: token });
    return { success: true, data: resp.data };
  } catch (err) {
    console.error("Backend login sync failed", err);
    return { success: false, error: "Backend sync failed" };
  }
};

export default api;