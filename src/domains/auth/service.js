import api from "api/client";

export const login = async (credentials) => {
  const res = await api.post("/auth/login/", credentials);
  return res.data?.data;
};

export const refresh = async (refreshToken) => {
  const res = await api.post("/auth/refresh/", { refresh: refreshToken });
  return res.data?.data;
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("workspace_id");
  window.location.href = "/auth/sign-in";
};

export const storeTokens = (data) => {
  localStorage.setItem("access", data?.access || "");
  if (data?.refresh) localStorage.setItem("refresh", data.refresh);
  if (data?.workspace_id) localStorage.setItem("workspace_id", data.workspace_id);
};

export const isAuthenticated = () => !!localStorage.getItem("access");
