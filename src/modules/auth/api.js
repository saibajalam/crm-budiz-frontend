import api from "@/api/client";

export const loginUser = async (data) => {
  const res = await api.post("/auth/login/", data);
  return res.data;
};