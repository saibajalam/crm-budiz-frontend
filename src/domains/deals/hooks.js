import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { QUERY_KEYS } from "constants/queryKeys";
import {
  handleMutationError,
  restoreQueries,
  snapshotQueries,
  updateMatchingListQueries,
} from "domains/shared/mutationUtils";
import { subscribeToWorkspaceDealsEvents } from "lib/websocketClient";
import {
  addDealActivity,
  createDeal,
  createDealNote,
  deleteDeal,
  getDealActivities,
  getDealById,
  getDeals,
  reorderDeal,
  updateDeal,
  updateDealStage,
} from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";
const IMPORTANT_ACTIVITY_TYPES = new Set(["STATUS_CHANGE", "STAGE_CHANGE"]);

const sanitizeParams = (params = {}) => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    acc[key] = value;
    return acc;
  }, {});
};

const getDealsBaseKey = (workspaceId) => [QUERY_KEYS.DEALS, workspaceId];
const getDealKey = (workspaceId, id) => [QUERY_KEYS.DEAL, workspaceId, id];
const getDealActivitiesBaseKey = (workspaceId, id) => [QUERY_KEYS.DEAL_ACTIVITIES, workspaceId, id];
const getDealActivitiesKey = (workspaceId, id, filters = {}) => {
  const normalized = sanitizeParams(filters);
  return Object.keys(normalized).length > 0
    ? [...getDealActivitiesBaseKey(workspaceId, id), normalized]
    : getDealActivitiesBaseKey(workspaceId, id);
};

const getDealContactsKey = (workspaceId, id) => [QUERY_KEYS.DEAL_CONTACTS, workspaceId, id];

const getListFromCache = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const mapDealByIdAcrossQueries = (queryClient, workspaceId, dealId, updater) => {
  queryClient.setQueriesData({ queryKey: getDealsBaseKey(workspaceId) }, (oldData) => {
    const list = getListFromCache(oldData);
    const updated = list.map((deal) => (deal.id === dealId ? updater(deal) : deal));

    if (Array.isArray(oldData)) return updated;
    if (oldData && typeof oldData === "object") {
      if (Array.isArray(oldData.results)) return { ...oldData, results: updated };
      if (Array.isArray(oldData.data)) return { ...oldData, data: updated };
    }
    return updated;
  });
};

const getActivityType = (item) => (item?.type || "NOTE").toUpperCase();

const getActivityText = (item) => {
  return (item?.note || item?.message || item?.description || "").toLowerCase();
};

const activityMatchesFilters = (item, filters = {}) => {
  const normalized = sanitizeParams(filters);
  if (Object.keys(normalized).length === 0) return true;

  const activityDate = new Date(item?.created_at || item?.timestamp || Date.now()).getTime();
  const itemType = getActivityType(item);
  const actor = String(item?.user_name || item?.user || item?.actor || "").toLowerCase();
  const text = getActivityText(item);

  if (normalized.type && String(normalized.type).toUpperCase() !== itemType) return false;
  if (normalized.user && !actor.includes(String(normalized.user).toLowerCase())) return false;
  if (normalized.q && !text.includes(String(normalized.q).toLowerCase())) return false;

  if (normalized.from) {
    const fromTs = new Date(normalized.from).getTime();
    if (!Number.isNaN(fromTs) && activityDate < fromTs) return false;
  }

  if (normalized.to) {
    const toTs = new Date(normalized.to).getTime();
    if (!Number.isNaN(toTs) && activityDate > toTs + 86399999) return false;
  }

  return true;
};

const replaceDealAcrossQueries = (queryClient, workspaceId, updatedDeal) => {
  if (!updatedDeal?.id) return;

  mapDealByIdAcrossQueries(queryClient, workspaceId, updatedDeal.id, () => updatedDeal);
  queryClient.setQueryData(getDealKey(workspaceId, updatedDeal.id), (old) => ({
    ...(old || {}),
    ...updatedDeal,
  }));
};

const appendActivityItem = (queryClient, workspaceId, dealId, activity) => {
  if (!activity) return;

  const snapshots = queryClient.getQueriesData({
    queryKey: getDealActivitiesBaseKey(workspaceId, dealId),
  });

  snapshots.forEach(([queryKey, oldData]) => {
    const filters = queryKey?.[3] || {};
    if (!activityMatchesFilters(activity, filters)) return;

    const list = getListFromCache(oldData);
    const nextList = [
      { ...activity, _important: IMPORTANT_ACTIVITY_TYPES.has(getActivityType(activity)) },
      ...list,
    ];

    if (Array.isArray(oldData)) {
      queryClient.setQueryData(queryKey, nextList);
      return;
    }

    if (oldData && typeof oldData === "object") {
      if (Array.isArray(oldData.results)) {
        queryClient.setQueryData(queryKey, { ...oldData, results: nextList });
        return;
      }
      if (Array.isArray(oldData.data)) {
        queryClient.setQueryData(queryKey, { ...oldData, data: nextList });
        return;
      }
    }

    queryClient.setQueryData(queryKey, nextList);
  });
};

export const useDeals = (params = {}, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalizedParams = sanitizeParams(params);
  const hasParams = Object.keys(normalizedParams).length > 0;

  return useQuery({
    queryKey: hasParams
      ? [...getDealsBaseKey(workspaceId), normalizedParams]
      : getDealsBaseKey(workspaceId),
    queryFn: () => getDeals(normalizedParams),
    ...options,
  });
};

export const useDeal = (id) => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: getDealKey(workspaceId, id),
    queryFn: () => getDealById(id),
    enabled: !!id,
  });
};

export const useDealActivities = (id, filters = {}, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalizedFilters = sanitizeParams(filters);

  return useQuery({
    queryKey: getDealActivitiesKey(workspaceId, id, normalizedFilters),
    queryFn: () => getDealActivities(id, normalizedFilters),
    enabled: !!id,
    ...options,
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();
  const baseKey = getDealsBaseKey(workspaceId);

  return useMutation({
    mutationFn: createDeal,
    onMutate: async (newDeal) => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousDeals = snapshotQueries(queryClient, baseKey);

      updateMatchingListQueries(queryClient, baseKey, (old) => [
        ...old,
        {
          ...newDeal,
          id: `temp-${Date.now()}`,
          workspace_id: workspaceId,
          position: newDeal.position ?? Date.now(),
        },
      ]);

      return { previousDeals };
    },
    onError: (error, _newDeal, context) => {
      restoreQueries(queryClient, context?.previousDeals);
      handleMutationError(error, "Failed to create deal");
    },
    onSuccess: (created) => {
      if (created) {
        replaceDealAcrossQueries(queryClient, workspaceId, created);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: baseKey, exact: false });
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();
  const baseKey = getDealsBaseKey(workspaceId);

  return useMutation({
    mutationFn: ({ id, data }) => updateDeal(id, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      await queryClient.cancelQueries({ queryKey: getDealKey(workspaceId, variables?.id) });

      const previousDeals = snapshotQueries(queryClient, baseKey);
      const previousDeal = queryClient.getQueryData(getDealKey(workspaceId, variables?.id));

      updateMatchingListQueries(queryClient, baseKey, (old) =>
        old.map((deal) =>
          deal.id === variables?.id ? { ...deal, ...(variables?.data || {}) } : deal
        )
      );

      queryClient.setQueryData(getDealKey(workspaceId, variables?.id), (old) => ({
        ...(old || {}),
        ...(variables?.data || {}),
      }));

      return { previousDeals, previousDeal };
    },
    onError: (error, variables, context) => {
      restoreQueries(queryClient, context?.previousDeals);
      queryClient.setQueryData(getDealKey(workspaceId, variables?.id), context?.previousDeal);
      handleMutationError(error, "Failed to update deal");
    },
    onSuccess: (updated) => {
      if (updated) {
        replaceDealAcrossQueries(queryClient, workspaceId, updated);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: getDealKey(workspaceId, variables?.id) });
      queryClient.invalidateQueries({ queryKey: baseKey, exact: false });
    },
  });
};

export const useAddDealNote = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();

  return useMutation({
    mutationFn: ({ id, note }) => createDealNote(id, note),
    onMutate: async ({ id, note }) => {
      const key = getDealActivitiesBaseKey(workspaceId, id);
      await queryClient.cancelQueries({ queryKey: key });
      const previousActivities = queryClient.getQueriesData({ queryKey: key });

      appendActivityItem(queryClient, workspaceId, id, {
        id: `temp-note-${Date.now()}`,
        type: "note",
        note,
        message: note,
        created_at: new Date().toISOString(),
        user_name: "You",
      });

      return { previousActivities, key };
    },
    onError: (error, _vars, context) => {
      restoreQueries(queryClient, context?.previousActivities);
      handleMutationError(error, "Failed to add note");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: getDealActivitiesBaseKey(workspaceId, variables?.id) });
    },
  });
};

export const useAddDealActivity = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();

  return useMutation({
    mutationFn: ({ id, activity }) => addDealActivity(id, activity),
    onMutate: async ({ id, activity }) => {
      const key = getDealActivitiesBaseKey(workspaceId, id);
      await queryClient.cancelQueries({ queryKey: key });
      const previousActivities = queryClient.getQueriesData({ queryKey: key });

      appendActivityItem(queryClient, workspaceId, id, {
        id: `temp-activity-${Date.now()}`,
        ...activity,
        created_at: new Date().toISOString(),
      });

      return { previousActivities, key };
    },
    onError: (error, _vars, context) => {
      restoreQueries(queryClient, context?.previousActivities);
      handleMutationError(error, "Failed to add activity");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: getDealActivitiesBaseKey(workspaceId, variables?.id) });
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();
  const baseKey = getDealsBaseKey(workspaceId);

  return useMutation({
    mutationFn: deleteDeal,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousDeals = snapshotQueries(queryClient, baseKey);

      updateMatchingListQueries(queryClient, baseKey, (old) =>
        old.filter((deal) => deal.id !== id)
      );

      return { previousDeals };
    },
    onError: (error, _id, context) => {
      restoreQueries(queryClient, context?.previousDeals);
      handleMutationError(error, "Failed to delete deal");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: baseKey, exact: false });
    },
  });
};

export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();
  const baseKey = getDealsBaseKey(workspaceId);

  return useMutation({
    mutationFn: ({ id, stage }) => updateDealStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousDeals = snapshotQueries(queryClient, baseKey);

      updateMatchingListQueries(queryClient, baseKey, (old = []) =>
        old.map((deal) => (deal.id === id ? { ...deal, stage } : deal))
      );

      return { previousDeals };
    },
    onError: (error, _variables, context) => {
      restoreQueries(queryClient, context?.previousDeals);
      handleMutationError(error, "Failed to update deal stage");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: baseKey, exact: false });
    },
  });
};

export const useReorderDeal = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();
  const baseKey = getDealsBaseKey(workspaceId);

  return useMutation({
    mutationFn: reorderDeal,
    onMutate: async ({ dealId, stage, position }) => {
      await queryClient.cancelQueries({ queryKey: baseKey });

      let previousDeal = null;
      const scopedQueries = queryClient.getQueriesData({ queryKey: baseKey });
      scopedQueries.forEach(([, data]) => {
        const matched = getListFromCache(data).find((deal) => deal.id === dealId);
        if (matched && !previousDeal) {
          previousDeal = {
            stage: matched.stage,
            position: matched.position,
          };
        }
      });

      mapDealByIdAcrossQueries(queryClient, workspaceId, dealId, (deal) => ({
        ...deal,
        stage,
        position,
      }));

      return { previousDeal, dealId };
    },
    onError: (error, _variables, context) => {
      if (context?.previousDeal) {
        mapDealByIdAcrossQueries(queryClient, workspaceId, context.dealId, (deal) => ({
          ...deal,
          stage: context.previousDeal.stage,
          position: context.previousDeal.position,
        }));
      }
      if (error?.response?.status === 409) {
        toast.error("Deal updated elsewhere");
        return;
      }
      handleMutationError(error, "Failed to reorder deal");
    },
    onSuccess: (updatedDeal) => {
      if (updatedDeal) {
        replaceDealAcrossQueries(queryClient, workspaceId, updatedDeal);
      }
    },
  });
};

export const useDealsRealtime = () => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();

  useEffect(() => {
    const unsubscribeUpdated = subscribeToWorkspaceDealsEvents(
      workspaceId,
      "deal.updated",
      (payload) => {
        mapDealByIdAcrossQueries(queryClient, workspaceId, payload?.id, (deal) => ({
          ...deal,
          ...payload,
        }));

        if (payload?.id) {
          queryClient.setQueryData(getDealKey(workspaceId, payload.id), (old) => ({
            ...(old || {}),
            ...payload,
            _recentlyUpdated: true,
          }));
        }
      }
    );

    const unsubscribeMoved = subscribeToWorkspaceDealsEvents(
      workspaceId,
      "deal.moved",
      (payload) => {
        mapDealByIdAcrossQueries(queryClient, workspaceId, payload?.id, (deal) => ({
          ...deal,
          stage: payload?.stage ?? deal.stage,
          position: payload?.position ?? deal.position,
          updated_at: payload?.updated_at ?? deal.updated_at,
        }));
      }
    );

    return () => {
      unsubscribeUpdated();
      unsubscribeMoved();
    };
  }, [queryClient, workspaceId]);
};

export const useDealRealtime = (dealId) => {
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId();

  useEffect(() => {
    if (!dealId) return;

    const unsubscribeUpdated = subscribeToWorkspaceDealsEvents(
      workspaceId,
      "deal.updated",
      (payload) => {
        if (String(payload?.id) !== String(dealId)) return;

        queryClient.setQueryData(getDealKey(workspaceId, dealId), (old) => ({
          ...(old || {}),
          ...payload,
        }));
      }
    );

    const unsubscribeActivity = subscribeToWorkspaceDealsEvents(
      workspaceId,
      "deal.activity.created",
      (payload) => {
        const payloadDealId = payload?.deal_id ?? payload?.deal;
        if (String(payloadDealId) !== String(dealId)) return;

        appendActivityItem(queryClient, workspaceId, dealId, payload);
      }
    );

    const unsubscribeContactUpdated = subscribeToWorkspaceDealsEvents(
      workspaceId,
      "contact.updated",
      (payload) => {
        const payloadDealId = payload?.deal_id ?? payload?.deal;
        if (payloadDealId && String(payloadDealId) !== String(dealId)) return;

        queryClient.setQueryData(getDealContactsKey(workspaceId, dealId), (oldData) => {
          const list = getListFromCache(oldData).map((contact) => {
            const payloadId = payload?.contact_id ?? payload?.id;
            if (String(contact.contact_id || contact.id) !== String(payloadId)) return contact;
            return { ...contact, ...payload, _recentlyUpdated: true };
          });

          if (Array.isArray(oldData)) return list;
          if (oldData && typeof oldData === "object") {
            if (Array.isArray(oldData.results)) return { ...oldData, results: list };
            if (Array.isArray(oldData.data)) return { ...oldData, data: list };
          }
          return list;
        });
      }
    );

    return () => {
      unsubscribeUpdated();
      unsubscribeActivity();
      unsubscribeContactUpdated();
    };
  }, [dealId, queryClient, workspaceId]);
};
