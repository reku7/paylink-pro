// src/api/api.js
import axios from "axios";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const privateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
});

// Request interceptor to add auth token
privateApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ FORCE NO CACHE
    config.headers["Cache-Control"] = "no-cache";
    config.headers["Pragma"] = "no-cache";
    config.headers["If-None-Match"] = null;

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle errors globally
privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Public API instance (no auth token)
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message:
        error.response.data?.message ||
        error.response.data?.error ||
        "Server error",
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: "Network error. Please check your connection.",
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || "Unknown error occurred",
      status: -1,
    };
  }
};
