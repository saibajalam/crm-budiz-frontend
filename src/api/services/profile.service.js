import api from "api/client";

export const profileService = {
  get: async () => {
    const res = await api.get("/profile/");
    return res.data;
  },

  update: async (data) => {
    const res = await api.patch("/profile/", data);
    return res.data;
  },
};
