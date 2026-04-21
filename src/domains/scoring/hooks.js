import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { subscribeToWorkspaceEvents } from "lib/websocketClient";
import { getContactScore, getLeadScores } from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";
const getLeadScoresKey = (workspaceId) => [QUERY_KEYS.LEAD_SCORES, workspaceId];
const getContactScoreKey = (workspaceId, contactId) => [QUERY_KEYS.CONTACT_SCORE, workspaceId, contactId];

const markScoreUpdated = (item) => ({ ...item, _recentlyUpdated: true, _updatedAt: Date.now() });

export const useLeadScores = (options = {}) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    const events = ["deal.updated", "contact.updated", "activity.created"];

    const unsubscribers = events.map((eventType) =>
      subscribeToWorkspaceEvents(workspaceId, eventType, (payload) => {
        const contactId = payload?.contact_id || payload?.contact;
        const dealContactId = payload?.contact_id;

        queryClient.invalidateQueries({ queryKey: getLeadScoresKey(workspaceId) });

        if (contactId) {
          queryClient.invalidateQueries({
            queryKey: getContactScoreKey(workspaceId, contactId),
          });
        }
        if (dealContactId) {
          queryClient.invalidateQueries({
            queryKey: getContactScoreKey(workspaceId, dealContactId),
          });
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, workspaceId]);

  return useQuery({
    queryKey: getLeadScoresKey(workspaceId),
    queryFn: getLeadScores,
    staleTime: 30 * 1000,
    select: (scores) => (Array.isArray(scores) ? scores.map(markScoreUpdated) : []),
    ...options,
  });
};

export const useContactScore = (contactId, options = {}) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!contactId) return;

    const events = ["deal.updated", "contact.updated", "activity.created"];

    const unsubscribers = events.map((eventType) =>
      subscribeToWorkspaceEvents(workspaceId, eventType, (payload) => {
        const payloadContactId = payload?.contact_id || payload?.contact;
        if (payloadContactId && String(payloadContactId) !== String(contactId)) return;

        queryClient.invalidateQueries({
          queryKey: getContactScoreKey(workspaceId, contactId),
        });
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [contactId, queryClient, workspaceId]);

  return useQuery({
    queryKey: getContactScoreKey(workspaceId, contactId),
    queryFn: () => getContactScore(contactId),
    enabled: !!contactId,
    staleTime: 30 * 1000,
    ...options,
  });
};
