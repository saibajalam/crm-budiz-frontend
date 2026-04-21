import api from "api/client";

export const getDealContacts = async (dealId) => {
  const res = await api.get(`/deals/${dealId}/contacts/`);
  return res.data?.data;
};

export const addDealContact = async (dealId, payload) => {
  const res = await api.post(`/deals/${dealId}/contacts/`, payload);
  return res.data?.data;
};

export const updateDealContact = async (dealId, contactId, payload) => {
  const res = await api.patch(`/deals/${dealId}/contacts/${contactId}/`, payload);
  return res.data?.data;
};

export const removeDealContact = async (dealId, contactId) => {
  const res = await api.delete(`/deals/${dealId}/contacts/${contactId}/`);
  return res.data?.data;
};
