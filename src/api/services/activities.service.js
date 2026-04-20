import api from "api/client";

export const activitiesService = {
  getAll: async (params = {}) => {
    const res = await api.get("/activities/", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/activities/${id}/`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/activities/", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/activities/${id}/`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/activities/${id}/`);
    return res.data;
  },
};
