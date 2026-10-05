import axios from "axios";
import { isMaintenanceModeActive } from "./maintenance";

export const AUTH_TOKEN_KEY = "parsu_auth_token";

// Server pool configuration: Primary and Secondary Render instances
const PRIMARY_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_HOST_URL || "https://parsuai-1y3u.onrender.com").trim().replace(/\/+$/, "");
const SECONDARY_URL = (import.meta.env.VITE_BACKEND_URL_BACKUP || "https://parsuai.onrender.com").trim().replace(/\/+$/, "");

// Track dead servers so we don't bounce back and forth
const failedServers = new Set();
export const SERVER_POOL = [PRIMARY_URL, SECONDARY_URL].filter(Boolean);

let currentServer = PRIMARY_URL;

export function getActiveBackendUrl() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  }
  return currentServer;
}

export const API_BASE_URL = import.meta.env.DEV ? "" : getActiveBackendUrl();
export const BACKEND_URL = getActiveBackendUrl();

const customAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
});

// Attach Bearer token from localStorage to support cross-domain auth (Vercel -> Render)
export function attachAuthHeader(instance) {
  instance.interceptors.request.use((config) => {
    // If maintenance mode is active, completely block all outgoing server and database requests
    if (isMaintenanceModeActive()) {
      return Promise.reject(new Error("Application is currently under maintenance. Network requests are disabled."));
    }

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem("perplexity_auth_token");
      if (token && !(config.headers || {}).Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage may fail in restricted sandboxes
    }
    return config;
  });
  return instance;
}

attachAuthHeader(customAxios);
attachAuthHeader(axios);

// Helper function to switch active backend server permanently
export function switchActiveServer(failedUrl) {
  if (failedUrl) {
    failedServers.add(failedUrl);
  }
  
  // Find a server that hasn't failed yet, or fallback to the other
  const candidate = SERVER_POOL.find(s => !failedServers.has(s)) || SERVER_POOL.find(s => s !== currentServer) || SERVER_POOL[0];
  
  if (candidate && candidate !== currentServer) {
    currentServer = candidate;
    if (!import.meta.env.DEV) {
      customAxios.defaults.baseURL = currentServer;
      axios.defaults.baseURL = currentServer;
    }
    console.warn(`[Failover] Active backend server permanently switched to: ${currentServer}`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("backend_server_switched", { detail: { serverUrl: currentServer } }));
    }
  }
  return currentServer;
}

// Intercept network failures and server down/limit responses to trigger failover
customAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect server down, network drop, timeout, or 502/503/504 / CORS failure (preflight rejected when Render suspended)
    const isServerError =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ERR_NETWORK" ||
      [502, 503, 504].includes(error.response?.status);

    if (isServerError && !originalRequest._retriedWithBackup && SERVER_POOL.length > 1 && !import.meta.env.DEV) {
      originalRequest._retriedWithBackup = true;
      const prevServer = currentServer;
      const nextServer = switchActiveServer(prevServer);

      // Re-target URL on the healthy server
      originalRequest.baseURL = nextServer;
      if (originalRequest.url && originalRequest.url.startsWith('http')) {
        originalRequest.url = originalRequest.url.replace(prevServer, nextServer);
      }

      console.warn(`[Failover] Primary backend unresponsive or suspended (${prevServer}). Retrying on: ${nextServer}`);
      return customAxios(originalRequest);
    }

    if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.code === 'ECONNABORTED')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app_network_error', { detail: { error } }));
      }
    }
    return Promise.reject(error);
  }
);

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export default customAxios;

