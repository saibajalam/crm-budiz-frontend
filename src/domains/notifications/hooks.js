import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import {
  handleMutationError,
  restoreQueries,
  snapshotQueries,
  updateMatchingListQueries,
} from "domains/shared/mutationUtils";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./service";

export const useNotifications = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS],
    queryFn: getNotifications,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      const previousNotifications = snapshotQueries(queryClient, QUERY_KEYS.NOTIFICATIONS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.NOTIFICATIONS, (old) =>
        old.map((item) =>
          item.id === id ? { ...item, read: true, is_read: true } : item
        )
      );

      return { previousNotifications };
    },
    onError: (error, _id, context) => {
      restoreQueries(queryClient, context?.previousNotifications);
      handleMutationError(error, "Failed to mark notification as read");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      const previousNotifications = snapshotQueries(queryClient, QUERY_KEYS.NOTIFICATIONS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.NOTIFICATIONS, (old) =>
        old.map((item) => ({ ...item, read: true, is_read: true }))
      );

      return { previousNotifications };
    },
    onError: (error, _payload, context) => {
      restoreQueries(queryClient, context?.previousNotifications);
      handleMutationError(error, "Failed to mark all notifications as read");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });
};
