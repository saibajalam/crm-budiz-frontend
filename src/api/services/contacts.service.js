import api from "api/client";

export const contactsService = {
  getAll: async (params = {}) => {
    const res = await api.get("/contacts/", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/contacts/${id}/`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/contacts/", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/contacts/${id}/`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/contacts/${id}/`);
    return res.data;
  },
};
