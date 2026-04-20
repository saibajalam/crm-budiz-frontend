import api from "api/client";

export const dealsService = {
  getAll: async (params = {}) => {
    const res = await api.get("/deals/", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/deals/${id}/`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/deals/", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/deals/${id}/`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/deals/${id}/`);
    return res.data;
  },
};
