import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT and workspace ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    const workspace = localStorage.getItem("workspace_id");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (workspace) {
      config.headers["X-Workspace-ID"] = workspace;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with token refresh + global errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("workspace_id");
  window.location.href = "/auth/sign-in";
};

const getErrorMessage = (error) => {
  if (!error.response) return "Network error. Please check your connection.";
  const data = error.response.data;
  return (
    data?.detail ||
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    `Request failed (${error.response.status})`
  );
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // --- 401 handling with silent token refresh ---
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login/") &&
      !originalRequest.url.includes("/auth/refresh/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          "http://localhost:8000/api/auth/refresh/",
          { refresh: refreshToken }
        );
        localStorage.setItem("access", data.access);
        if (data.refresh) {
          localStorage.setItem("refresh", data.refresh);
        }
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // --- Global error toasts (skip if caller opts out) ---
    if (!originalRequest._silent) {
      const msg = getErrorMessage(error);
      if (status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (status === 404) {
        // 404s are often expected (silent)
      } else if (status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (status !== 401) {
        toast.error(msg);
      }
    }

    return Promise.reject(error);
  }
);

export default api;