import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { handleMutationError } from "domains/shared/mutationUtils";
import { subscribeToWorkspaceDealsEvents } from "lib/websocketClient";
import {
  addDealContact,
  getDealContacts,
  removeDealContact,
  updateDealContact,
} from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";
const getDealContactsKey = (workspaceId, dealId) => [QUERY_KEYS.DEAL_CONTACTS, workspaceId, dealId];

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

export const useDealContacts = (dealId) => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: getDealContactsKey(workspaceId, dealId),
    queryFn: () => getDealContacts(dealId),
    enabled: !!dealId,
  });
};

export const useAddDealContact = () => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, payload }) => addDealContact(dealId, payload),
    onMutate: async ({ dealId, payload }) => {
      const key = getDealContactsKey(workspaceId, dealId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (oldData) => {
        const list = normalizeList(oldData);
        const optimistic = {
          id: `temp-${Date.now()}`,
          contact_id: payload.contact_id,
          role: payload.role || "Participant",
          is_primary: !!payload.is_primary,
          name: payload.name || payload.contact_name || "Contact",
          email: payload.email || "",
          phone: payload.phone || "",
        };

        if (Array.isArray(oldData)) return [...list, optimistic];
        if (oldData && typeof oldData === "object") {
          if (Array.isArray(oldData.results)) return { ...oldData, results: [...list, optimistic] };
          if (Array.isArray(oldData.data)) return { ...oldData, data: [...list, optimistic] };
        }
        return [...list, optimistic];
      });

      return { key, previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(context?.key, context?.previous);
      handleMutationError(error, "Failed to add contact");
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: getDealContactsKey(workspaceId, vars?.dealId) });
    },
  });
};

export const useUpdateDealContact = () => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, contactId, payload }) => updateDealContact(dealId, contactId, payload),
    onMutate: async ({ dealId, contactId, payload }) => {
      const key = getDealContactsKey(workspaceId, dealId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (oldData) => {
        const list = normalizeList(oldData).map((item) =>
          String(item.contact_id || item.id) === String(contactId)
            ? { ...item, ...payload }
            : item
        );

        if (Array.isArray(oldData)) return list;
        if (oldData && typeof oldData === "object") {
          if (Array.isArray(oldData.results)) return { ...oldData, results: list };
          if (Array.isArray(oldData.data)) return { ...oldData, data: list };
        }
        return list;
      });

      return { key, previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(context?.key, context?.previous);
      handleMutationError(error, "Failed to update deal contact");
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: getDealContactsKey(workspaceId, vars?.dealId) });
    },
  });
};

export const useRemoveDealContact = () => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, contactId }) => removeDealContact(dealId, contactId),
    onMutate: async ({ dealId, contactId }) => {
      const key = getDealContactsKey(workspaceId, dealId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (oldData) => {
        const list = normalizeList(oldData).filter(
          (item) => String(item.contact_id || item.id) !== String(contactId)
        );

        if (Array.isArray(oldData)) return list;
        if (oldData && typeof oldData === "object") {
          if (Array.isArray(oldData.results)) return { ...oldData, results: list };
          if (Array.isArray(oldData.data)) return { ...oldData, data: list };
        }
        return list;
      });

      return { key, previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(context?.key, context?.previous);
      handleMutationError(error, "Failed to remove deal contact");
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: getDealContactsKey(workspaceId, vars?.dealId) });
    },
  });
};

export const useDealContactsRealtime = (dealId) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!dealId) return;

    return subscribeToWorkspaceDealsEvents(workspaceId, "contact.updated", (payload) => {
      const key = getDealContactsKey(workspaceId, dealId);
      const payloadContactId = payload?.contact_id ?? payload?.id;
      const payloadDealId = payload?.deal_id ?? payload?.deal;

      if (payloadDealId && String(payloadDealId) !== String(dealId)) return;

      queryClient.setQueryData(key, (oldData) => {
        const list = normalizeList(oldData).map((item) => {
          if (String(item.contact_id || item.id) !== String(payloadContactId)) return item;
          return {
            ...item,
            ...payload,
            _recentlyUpdated: true,
          };
        });

        if (Array.isArray(oldData)) return list;
        if (oldData && typeof oldData === "object") {
          if (Array.isArray(oldData.results)) return { ...oldData, results: list };
          if (Array.isArray(oldData.data)) return { ...oldData, data: list };
        }
        return list;
      });
    });
  }, [dealId, queryClient, workspaceId]);
};
