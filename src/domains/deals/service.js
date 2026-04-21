import api from "api/client";

export const getDeals = async (params = {}) => {
  const res = await api.get("/deals/", { params });
  return res.data?.data;
};

export const getDealById = async (id) => {
  const res = await api.get(`/deals/${id}/`);
  return res.data?.data;
};

export const createDeal = async (payload) => {
  const res = await api.post("/deals/", payload);
  return res.data?.data;
};

export const updateDeal = async (idOrObject, data) => {
  const id = typeof idOrObject === "object" ? idOrObject.id : idOrObject;
  const payload = typeof idOrObject === "object" ? idOrObject.payload || idOrObject.data : data;

  const res = await api.patch(`/deals/${id}/`, payload);
  return res.data?.data;
};

export const updateDealStage = async (id, stage) => {
  const res = await api.patch(`/deals/${id}/`, { stage });
  return res.data?.data;
};

export const reorderDeal = async ({ dealId, stage, position, updatedAt }) => {
  const payload = {
    deal_id: dealId,
    stage,
    position,
  };

  if (updatedAt) {
    payload.updated_at = updatedAt;
  }

  const res = await api.patch("/deals/reorder/", payload);
  return res.data?.data;
};

export const getDealActivities = async (id, params = {}) => {
  const res = await api.get(`/deals/${id}/activities/`, { params });
  return res.data?.data;
};

export const createDealNote = async (id, note) => {
  const res = await api.post(`/deals/${id}/notes/`, { note });
  return res.data?.data;
};

export const addDealActivity = async (id, activity) => {
  const res = await api.post(`/deals/${id}/activities/`, activity);
  return res.data?.data;
};

export const deleteDeal = async (id) => {
  const res = await api.delete(`/deals/${id}/`);
  return res.data?.data;
};
