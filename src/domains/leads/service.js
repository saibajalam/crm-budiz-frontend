import api from "api/client";

export const getLeads = async (params = {}) => {
  const res = await api.get("/leads/", { params });
  return res.data?.data;
};

export const getLeadById = async (id) => {
  const res = await api.get(`/leads/${id}/`);
  return res.data?.data;
};

export const createLead = async (payload) => {
  const res = await api.post("/leads/", payload);
  return res.data?.data;
};

export const updateLead = async ({ id, payload }) => {
  const res = await api.patch(`/leads/${id}/`, payload);
  return res.data?.data;
};

export const deleteLead = async (id) => {
  const res = await api.delete(`/leads/${id}/`);
  return res.data?.data;
};
