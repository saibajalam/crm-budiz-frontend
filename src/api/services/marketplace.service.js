import api from "api/client";

export const marketplaceService = {
  getTrending: async () => {
    const res = await api.get("/marketplace/trending/");
    return res.data;
  },

  getRecent: async () => {
    const res = await api.get("/marketplace/recent/");
    return res.data;
  },

  getTopCreators: async () => {
    const res = await api.get("/marketplace/top-creators/");
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get("/marketplace/history/");
    return res.data;
  },
};
