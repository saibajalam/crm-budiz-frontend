import api from "api/client";

export const getActivities = async (params = {}) => {
  const res = await api.get("/activities/", { params });
  return res.data?.data;
};

export const getActivityById = async (id) => {
  const res = await api.get(`/activities/${id}/`);
  return res.data?.data;
};

export const createActivity = async (payload) => {
  const res = await api.post("/activities/", payload);
  return res.data?.data;
};

export const updateActivity = async ({ id, payload }) => {
  const res = await api.patch(`/activities/${id}/`, payload);
  return res.data?.data;
};

export const deleteActivity = async (id) => {
  const res = await api.delete(`/activities/${id}/`);
  return res.data?.data;
};
