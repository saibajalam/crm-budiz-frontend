import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import {
  handleMutationError,
  restoreQueries,
  snapshotQueries,
  updateMatchingListQueries,
} from "domains/shared/mutationUtils";
import { createLead, deleteLead, getLeadById, getLeads, updateLead } from "./service";

export const useLeads = (params = {}) => {
  const hasParams = Object.keys(params).length > 0;
  return useQuery({
    queryKey: hasParams ? [QUERY_KEYS.LEADS, params] : [QUERY_KEYS.LEADS],
    queryFn: () => getLeads(params),
  });
};

export const useLead = (id) => {
  return useQuery({
    queryKey: [QUERY_KEYS.LEADS, "detail", id],
    queryFn: () => getLeadById(id),
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onMutate: async (newLead) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.LEADS] });
      const previousLeads = snapshotQueries(queryClient, QUERY_KEYS.LEADS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.LEADS, (old) => [
        ...old,
        { ...newLead, id: `temp-${Date.now()}` },
      ]);

      return { previousLeads };
    },
    onError: (error, _newLead, context) => {
      restoreQueries(queryClient, context?.previousLeads);
      handleMutationError(error, "Failed to create lead");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLead,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.LEADS] });
      const previousLeads = snapshotQueries(queryClient, QUERY_KEYS.LEADS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.LEADS, (old) =>
        old.map((lead) =>
          lead.id === variables?.id ? { ...lead, ...(variables?.payload || {}) } : lead
        )
      );

      return { previousLeads };
    },
    onError: (error, _variables, context) => {
      restoreQueries(queryClient, context?.previousLeads);
      handleMutationError(error, "Failed to update lead");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.LEADS] });
      const previousLeads = snapshotQueries(queryClient, QUERY_KEYS.LEADS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.LEADS, (old) =>
        old.filter((lead) => lead.id !== id)
      );

      return { previousLeads };
    },
    onError: (error, _id, context) => {
      restoreQueries(queryClient, context?.previousLeads);
      handleMutationError(error, "Failed to delete lead");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] });
    },
  });
};
