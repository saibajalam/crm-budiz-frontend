import api from "@/api/client";

export const getLeads = async () => {
  const res = await api.get("/leads/");
  return res.data.data;
};