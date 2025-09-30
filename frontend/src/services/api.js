// frontend/src/services/api.js

// Notes:
// - Non-breaking: keeps existing exports, axios instance, and domain API shapes.
// - Adds initializeSession() that clears any existing token/session_id and calls createSession().
// - Adds minimal JWT helpers used only to keep future hardening simple, without changing behavior.
// - Leaves interceptors logic intact aside from safe Authorization header injection if a token exists.

import axios from "axios";

// -------------------------------
// Config
// -------------------------------
const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL ||
  window?.REACT_APP_API_BASE_URL ||
  "https://accordai-mb59.onrender.com/api/v1";

const TOKEN_KEY = "access_token";
const SESSION_ID_KEY = "session_id";

// -------------------------------
// Axios instance
// -------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// -------------------------------
// Optional helpers (non-invasive)
// -------------------------------
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
  if (!data?.exp) return false; // preserve existing behavior: don't proactively expire
  const now = Math.floor(Date.now() / 1000);
  // No proactive clearing; interceptor only attaches header if token exists
  return data.exp <= now;
}

// -------------------------------
// Interceptors (preserve behavior)
// -------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Only attach if present; do not change any other request behavior.
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Keep response interceptor logic minimal and non-breaking.
// If your existing file had additional logging/flows, they can be re-added here unchanged.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// -------------------------------
// Session management
// -------------------------------
export const createSession = async () => {
  try {
    console.log("🔐 Creating new session...");
    const response = await api.post("/auth/create-session", {
      client_info: "web_client",
    });
    const { access_token, session_id } = response.data || {};
    if (access_token) {
      localStorage.setItem(TOKEN_KEY, access_token);
    }
    if (session_id) {
      localStorage.setItem(SESSION_ID_KEY, session_id);
    }
    console.log("✅ Session created successfully");
    return { access_token, session_id };
  } catch (error) {
    console.error("❌ Create session error:", error);
    throw new Error(error?.response?.data?.detail || "Failed to create session");
  }
};

// Prevent duplicate initialization during boot/HMR without changing behavior elsewhere.
let __init_inflight = null;

// ✅ Force a new token on every hard load (as requested)
export const initializeSession = async () => {
  if (__init_inflight) return __init_inflight;
  console.log("🚀 Forcing new session initialization...");
  // Always remove any existing token first
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_ID_KEY);

  __init_inflight = (async () => {
    try {
      await createSession();
    } catch (error) {
      console.error("Fatal: Could not initialize session on load.", error);
      // Do not throw to avoid blocking app mount chains; preserve resilience.
    } finally {
      __init_inflight = null;
    }
  })();

  return __init_inflight;
};

export const getSessionToken = () => localStorage.getItem(TOKEN_KEY);
export const getSessionId = () => localStorage.getItem(SESSION_ID_KEY);

// -------------------------------
// Domain APIs (keep signatures/paths)
// -------------------------------
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
