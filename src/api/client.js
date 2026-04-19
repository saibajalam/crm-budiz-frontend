import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  const workspace = localStorage.getItem("workspace_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (workspace) {
    config.headers["X-Workspace-ID"] = workspace;
  }

  return config;
});

export default api;