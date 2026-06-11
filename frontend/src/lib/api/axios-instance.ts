import axios from "axios";
import { API_BASE_URL } from "@/config";

// =============================================================================
// Configured Axios instance — internal implementation detail.
// Do NOT export this from src/lib/api/index.ts.
// =============================================================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT from cookie if present
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    // SSR guard — document is not available in Node.js / Server Components
    if (typeof window === "undefined") return config;
    try {
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("lapis_token="));
      const token = match ? match.split("=")[1] : null;

      if (token) {
        config.headers.Authorization = "Bearer " + token;
      }
    } catch {
      // Silently continue if document is not available (e.g. SSR context)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 globally
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      // Clear the auth cookie
      document.cookie =
        "lapis_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
