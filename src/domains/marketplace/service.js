import api from "api/client";

export const getMarketplaceTrending = async () => {
  const res = await api.get("/marketplace/trending/");
  return res.data?.data;
};

export const getMarketplaceRecent = async () => {
  const res = await api.get("/marketplace/recent/");
  return res.data?.data;
};

export const getMarketplaceTopCreators = async () => {
  const res = await api.get("/marketplace/top-creators/");
  return res.data?.data;
};

export const getMarketplaceHistory = async () => {
  const res = await api.get("/marketplace/history/");
  return res.data?.data;
};
