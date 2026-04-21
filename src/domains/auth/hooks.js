import { useMutation } from "@tanstack/react-query";
import { login, logout, storeTokens, isAuthenticated, refresh } from "./service";

export const useLogin = (options = {}) => {
  return useMutation({ mutationFn: login, ...options });
};

export const useAuthActions = () => ({
  logout,
  storeTokens,
  isAuthenticated,
  refresh,
});
