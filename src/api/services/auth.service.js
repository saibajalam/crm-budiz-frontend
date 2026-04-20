import api from "api/client";

export const authService = {
  login: async (credentials) => {
    const res = await api.post("/auth/login/", credentials);
    return res.data;
  },

  refresh: async (refreshToken) => {
    const res = await api.post("/auth/refresh/", { refresh: refreshToken });
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("workspace_id");
    window.location.href = "/auth/sign-in";
  },

  storeTokens: (data) => {
    localStorage.setItem("access", data.access);
    if (data.refresh) localStorage.setItem("refresh", data.refresh);
    if (data.workspace_id) localStorage.setItem("workspace_id", data.workspace_id);
  },

  isAuthenticated: () => !!localStorage.getItem("access"),
};
