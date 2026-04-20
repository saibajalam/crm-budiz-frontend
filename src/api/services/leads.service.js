import api from "api/client";

export const leadsService = {
  getAll: async (params = {}) => {
    const res = await api.get("/leads/", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/leads/${id}/`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/leads/", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/leads/${id}/`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/leads/${id}/`);
    return res.data;
  },
};
