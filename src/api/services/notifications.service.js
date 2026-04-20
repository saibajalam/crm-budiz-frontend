import api from "api/client";

export const notificationsService = {
  getAll: async () => {
    const res = await api.get("/notifications/");
    const data = res.data;
    return Array.isArray(data) ? data : data.results || [];
  },

  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read/`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await api.post("/notifications/mark-all-read/");
    return res.data;
  },
};
