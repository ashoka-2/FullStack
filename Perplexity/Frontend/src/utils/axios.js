import axios from "axios";
import { isMaintenanceModeActive } from "./maintenance";

export const AUTH_TOKEN_KEY = "perplexity_auth_token";

// Read API base URL strictly from environment variables (VITE_BACKEND_URL or VITE_HOST_URL)
const rawEnvUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_HOST_URL;

// DEV (vite dev server): use RELATIVE URLs (/api/...) so every request goes through
// the Vite proxy in vite.config.js -> same-origin -> zero CORS issues, cookies just work.
// PROD (vite build): VITE_BACKEND_URL / VITE_HOST_URL is baked in at build time and points
// at the Render backend.
export const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (rawEnvUrl && rawEnvUrl.trim())
    ? rawEnvUrl.trim().replace(/\/+$/, "")
    : "";

const customAxios = axios.create({
  baseURL: API_BASE_URL,
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
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
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

// Intercept network failures to notify ConnectionMonitor
customAxios.interceptors.response.use(
  (response) => response,
  (error) => {
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

