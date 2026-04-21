import api from "api/client";

export const getProfile = async () => {
  const res = await api.get("/profile/");
  return res.data?.data;
};

export const updateProfile = async (payload) => {
  const res = await api.patch("/profile/", payload);
  return res.data?.data;
};
