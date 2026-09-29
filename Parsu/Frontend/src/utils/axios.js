import axios from "axios";
import { isMaintenanceModeActive } from "./maintenance";

export const AUTH_TOKEN_KEY = "parsu_auth_token";

// Server pool configuration: Primary and Secondary Render instances
const PRIMARY_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_HOST_URL || "https://parsuai.onrender.com").trim().replace(/\/+$/, "");
const SECONDARY_URL = (import.meta.env.VITE_BACKEND_URL_BACKUP || "https://parsuai-1y3u.onrender.com").trim().replace(/\/+$/, "");

export const SERVER_POOL = [PRIMARY_URL, SECONDARY_URL].filter(Boolean);

// In dev mode: relative URL goes through Vite proxy (http://localhost:3000)
// In production: dynamically resolve working server
let activeServerIndex = 0;

export function getActiveBackendUrl() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  }
  return SERVER_POOL[activeServerIndex] || PRIMARY_URL;
}

export const API_BASE_URL = import.meta.env.DEV ? "" : getActiveBackendUrl();
export const BACKEND_URL = getActiveBackendUrl();

const customAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000, // 12 seconds before failing over to backup server
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

// Helper function to switch active backend server
export function switchActiveServer() {
  if (SERVER_POOL.length > 1) {
    activeServerIndex = (activeServerIndex + 1) % SERVER_POOL.length;
    const newTarget = SERVER_POOL[activeServerIndex];
    if (!import.meta.env.DEV) {
      customAxios.defaults.baseURL = newTarget;
      axios.defaults.baseURL = newTarget;
    }
    console.warn(`[Failover] Switched active backend server to: ${newTarget}`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("backend_server_switched", { detail: { serverUrl: newTarget } }));
    }
    return newTarget;
  }
  return SERVER_POOL[0];
}

// Intercept network failures and server down/limit responses to trigger failover
customAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect server down, network drop, timeout, or 502/503/504 (e.g. Render suspended or cold start timeout)
    const isServerError =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ERR_NETWORK" ||
      [502, 503, 504].includes(error.response?.status);

    // If server failure happened in production and we haven't already retried this request on backup
    if (isServerError && !originalRequest._retriedWithBackup && SERVER_POOL.length > 1) {
      originalRequest._retriedWithBackup = true;
      const nextServer = switchActiveServer();

      // Update base URL for retry
      originalRequest.baseURL = nextServer;

      console.warn(`[Failover] Primary backend unresponsive or suspended. Retrying request on: ${nextServer}`);
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

