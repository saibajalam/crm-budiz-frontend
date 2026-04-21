import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import {
  handleMutationError,
  restoreQueries,
  snapshotQueries,
  updateMatchingListQueries,
} from "domains/shared/mutationUtils";
import {
  createActivity,
  deleteActivity,
  getActivities,
  getActivityById,
  updateActivity,
} from "./service";

export const useActivities = (params = {}) => {
  const hasParams = Object.keys(params).length > 0;
  return useQuery({
    queryKey: hasParams ? [QUERY_KEYS.ACTIVITIES, params] : [QUERY_KEYS.ACTIVITIES],
    queryFn: () => getActivities(params),
  });
};

export const useActivity = (id) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVITIES, "detail", id],
    queryFn: () => getActivityById(id),
    enabled: !!id,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivity,
    onMutate: async (newActivity) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ACTIVITIES] });
      const previousActivities = snapshotQueries(queryClient, QUERY_KEYS.ACTIVITIES);

      updateMatchingListQueries(queryClient, QUERY_KEYS.ACTIVITIES, (old) => [
        ...old,
        { ...newActivity, id: `temp-${Date.now()}` },
      ]);

      return { previousActivities };
    },
    onError: (error, _newActivity, context) => {
      restoreQueries(queryClient, context?.previousActivities);
      handleMutationError(error, "Failed to create activity");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVITIES] });
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateActivity,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ACTIVITIES] });
      const previousActivities = snapshotQueries(queryClient, QUERY_KEYS.ACTIVITIES);

      updateMatchingListQueries(queryClient, QUERY_KEYS.ACTIVITIES, (old) =>
        old.map((activity) =>
          activity.id === variables?.id
            ? { ...activity, ...(variables?.payload || {}) }
            : activity
        )
      );

      return { previousActivities };
    },
    onError: (error, _variables, context) => {
      restoreQueries(queryClient, context?.previousActivities);
      handleMutationError(error, "Failed to update activity");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVITIES] });
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivity,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ACTIVITIES] });
      const previousActivities = snapshotQueries(queryClient, QUERY_KEYS.ACTIVITIES);

      updateMatchingListQueries(queryClient, QUERY_KEYS.ACTIVITIES, (old) =>
        old.filter((activity) => activity.id !== id)
      );

      return { previousActivities };
    },
    onError: (error, _id, context) => {
      restoreQueries(queryClient, context?.previousActivities);
      handleMutationError(error, "Failed to delete activity");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVITIES] });
    },
  });
};
