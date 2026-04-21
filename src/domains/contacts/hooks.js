import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import {
  handleMutationError,
  restoreQueries,
  snapshotQueries,
  updateMatchingListQueries,
} from "domains/shared/mutationUtils";
import {
  createContact,
  deleteContact,
  getContactById,
  getContacts,
  updateContact,
} from "./service";

export const useContacts = (params = {}) => {
  const hasParams = Object.keys(params).length > 0;
  return useQuery({
    queryKey: hasParams ? [QUERY_KEYS.CONTACTS, params] : [QUERY_KEYS.CONTACTS],
    queryFn: () => getContacts(params),
  });
};

export const useContact = (id) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONTACTS, "detail", id],
    queryFn: () => getContactById(id),
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onMutate: async (newContact) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.CONTACTS] });
      const previousContacts = snapshotQueries(queryClient, QUERY_KEYS.CONTACTS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.CONTACTS, (old) => [
        ...old,
        { ...newContact, id: `temp-${Date.now()}` },
      ]);

      return { previousContacts };
    },
    onError: (error, _newContact, context) => {
      restoreQueries(queryClient, context?.previousContacts);
      handleMutationError(error, "Failed to create contact");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTACTS] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContact,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.CONTACTS] });
      const previousContacts = snapshotQueries(queryClient, QUERY_KEYS.CONTACTS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.CONTACTS, (old) =>
        old.map((contact) =>
          contact.id === variables?.id
            ? { ...contact, ...(variables?.payload || {}) }
            : contact
        )
      );

      return { previousContacts };
    },
    onError: (error, _variables, context) => {
      restoreQueries(queryClient, context?.previousContacts);
      handleMutationError(error, "Failed to update contact");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTACTS] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.CONTACTS] });
      const previousContacts = snapshotQueries(queryClient, QUERY_KEYS.CONTACTS);

      updateMatchingListQueries(queryClient, QUERY_KEYS.CONTACTS, (old) =>
        old.filter((contact) => contact.id !== id)
      );

      return { previousContacts };
    },
    onError: (error, _id, context) => {
      restoreQueries(queryClient, context?.previousContacts);
      handleMutationError(error, "Failed to delete contact");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTACTS] });
    },
  });
};
