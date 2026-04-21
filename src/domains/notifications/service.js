import api from "api/client";

export const getNotifications = async () => {
  const res = await api.get("/notifications/");
  return res.data?.data;
};

export const markNotificationRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read/`);
  return res.data?.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.post("/notifications/mark-all-read/");
  return res.data?.data;
};
