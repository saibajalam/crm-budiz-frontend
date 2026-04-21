import api from "api/client";

export const searchAll = async (query) => {
  const res = await api.get("/search/", { params: { q: query } });
  return res.data?.data;
};

export const searchDeals = async (query) => {
  const res = await api.get("/search/deals/", { params: { q: query } });
  return res.data?.data;
};

export const searchContacts = async (query) => {
  const res = await api.get("/search/contacts/", { params: { q: query } });
  return res.data?.data;
};
