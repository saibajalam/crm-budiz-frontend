import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { subscribeToWorkspaceEvents } from "lib/websocketClient";
import {
  getActivityAnalytics,
  getContactAnalytics,
  getDealAnalytics,
} from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";
const getAnalyticsKey = (workspaceId, scope, params = {}) => [QUERY_KEYS.ANALYTICS, workspaceId, scope, params];

const sanitizeParams = (params = {}) => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    acc[key] = value;
    return acc;
  }, {});
};

const useAnalyticsRealtime = (scope) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    const events = ["deal.updated", "contact.updated", "activity.created"];

    const unsubscribers = events.map((eventType) =>
      subscribeToWorkspaceEvents(workspaceId, eventType, (payload) => {
        const shouldUpdate =
          scope === "deals" ? eventType === "deal.updated" || eventType === "activity.created" :
          scope === "activities" ? eventType === "activity.created" || eventType === "deal.updated" :
          eventType === "contact.updated" || eventType === "deal.updated" || eventType === "activity.created";

        if (!shouldUpdate) return;

        queryClient.setQueriesData(
          { queryKey: [QUERY_KEYS.ANALYTICS, workspaceId, scope] },
          (oldData) => {
            if (!oldData || typeof oldData !== "object") return oldData;

            if (scope === "deals" && eventType === "deal.updated") {
              const totalDeals = Number(oldData.totalDeals || 0);
              const previousAverage = Number(oldData.averageDealValue || 0);
              const payloadValue = Number(payload?.value || 0);
              const averageDealValue =
                totalDeals > 0
                  ? Number(
                      (
                        (previousAverage * Math.max(totalDeals - 1, 0) + payloadValue) /
                        totalDeals
                      ).toFixed(2)
                    )
                  : payloadValue;

              return {
                ...oldData,
                averageDealValue,
                _recentlyUpdated: true,
              };
            }

            if (scope === "activities" && eventType === "activity.created") {
              const today = new Date().toISOString().slice(0, 10);
              const current = Array.isArray(oldData.activitiesPerDay) ? oldData.activitiesPerDay : [];
              const existing = current.find((entry) => entry.date === today);

              const activitiesPerDay = existing
                ? current.map((entry) =>
                    entry.date === today ? { ...entry, count: Number(entry.count || 0) + 1 } : entry
                  )
                : [...current, { date: today, count: 1 }];

              return {
                ...oldData,
                activitiesPerDay,
                _recentlyUpdated: true,
              };
            }

            if (scope === "contacts" && eventType === "contact.updated") {
              const list = Array.isArray(oldData.mostEngagedContacts) ? oldData.mostEngagedContacts : [];
              const contactId = payload?.id || payload?.contact_id;
              const mostEngagedContacts = list.map((entry) =>
                String(entry.contactId) === String(contactId)
                  ? { ...entry, name: payload?.name || entry.name, _recentlyUpdated: true }
                  : entry
              );

              return {
                ...oldData,
                mostEngagedContacts,
                _recentlyUpdated: true,
              };
            }

            return oldData;
          }
        );
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, scope, workspaceId]);
};

export const useDealAnalytics = (params = {}, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalizedParams = sanitizeParams(params);

  useAnalyticsRealtime("deals");

  return useQuery({
    queryKey: getAnalyticsKey(workspaceId, "deals", normalizedParams),
    queryFn: () => getDealAnalytics(normalizedParams),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useActivityAnalytics = (params = {}, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalizedParams = sanitizeParams(params);

  useAnalyticsRealtime("activities");

  return useQuery({
    queryKey: getAnalyticsKey(workspaceId, "activities", normalizedParams),
    queryFn: () => getActivityAnalytics(normalizedParams),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useContactAnalytics = (params = {}, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalizedParams = sanitizeParams(params);

  useAnalyticsRealtime("contacts");

  return useQuery({
    queryKey: getAnalyticsKey(workspaceId, "contacts", normalizedParams),
    queryFn: () => getContactAnalytics(normalizedParams),
    staleTime: 60 * 1000,
    ...options,
  });
};
