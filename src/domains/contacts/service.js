import api from "api/client";

export const getContacts = async (params = {}) => {
  const res = await api.get("/contacts/", { params });
  return res.data?.data;
};

export const getContactById = async (id) => {
  const res = await api.get(`/contacts/${id}/`);
  return res.data?.data;
};

export const createContact = async (payload) => {
  const res = await api.post("/contacts/", payload);
  return res.data?.data;
};

export const updateContact = async ({ id, payload }) => {
  const res = await api.patch(`/contacts/${id}/`, payload);
  return res.data?.data;
};

export const deleteContact = async (id) => {
  const res = await api.delete(`/contacts/${id}/`);
  return res.data?.data;
};
