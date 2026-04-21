import toast from "react-hot-toast";

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error?.response) return fallback;
  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    error.response?.data?.error ||
    fallback
  );
};

export const handleMutationError = (error, fallback) => {
  toast.error(getErrorMessage(error, fallback));
};

const normalizeListData = (oldData) => {
  if (Array.isArray(oldData)) return oldData;
  if (Array.isArray(oldData?.results)) return oldData.results;
  if (Array.isArray(oldData?.data)) return oldData.data;
  return [];
};

const rewrapListData = (oldData, nextList) => {
  if (Array.isArray(oldData)) return nextList;
  if (oldData && typeof oldData === "object") {
    if (Array.isArray(oldData.results)) return { ...oldData, results: nextList };
    if (Array.isArray(oldData.data)) return { ...oldData, data: nextList };
  }
  return nextList;
};

const toQueryKey = (key) => (Array.isArray(key) ? key : [key]);

export const snapshotQueries = (queryClient, key) => {
  return queryClient.getQueriesData({ queryKey: toQueryKey(key) });
};

export const restoreQueries = (queryClient, snapshots) => {
  (snapshots || []).forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

export const updateMatchingListQueries = (queryClient, key, updater) => {
  queryClient.setQueriesData({ queryKey: toQueryKey(key) }, (oldData) => {
    const currentList = normalizeListData(oldData);
    const nextList = updater(currentList);
    return rewrapListData(oldData, nextList);
  });
};
