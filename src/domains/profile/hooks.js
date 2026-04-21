import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { handleMutationError } from "domains/shared/mutationUtils";
import { getProfile, updateProfile } from "./service";

export const useProfile = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      const previousProfile = queryClient.getQueryData([QUERY_KEYS.PROFILE]);

      queryClient.setQueryData([QUERY_KEYS.PROFILE], (old) => ({
        ...(old || {}),
        ...(payload || {}),
      }));

      return { previousProfile };
    },
    onError: (error, _payload, context) => {
      queryClient.setQueryData([QUERY_KEYS.PROFILE], context?.previousProfile);
      handleMutationError(error, "Failed to update profile");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    },
  });
};
