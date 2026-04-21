import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { searchAll, searchContacts, searchDeals } from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";

export const useSearchAll = (query, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalized = (query || "").trim();

  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH, workspaceId, "all", normalized],
    queryFn: () => searchAll(normalized),
    enabled: normalized.length > 1,
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useSearchDeals = (query, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalized = (query || "").trim();

  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH, workspaceId, "deals", normalized],
    queryFn: () => searchDeals(normalized),
    enabled: normalized.length > 1,
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useSearchContacts = (query, options = {}) => {
  const workspaceId = getWorkspaceId();
  const normalized = (query || "").trim();

  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH, workspaceId, "contacts", normalized],
    queryFn: () => searchContacts(normalized),
    enabled: normalized.length > 1,
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useDebouncedSearchValue = (value, delay = 250) => {
  const [debouncedValue, setDebouncedValue] = useState((value || "").trim());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue((value || "").trim());
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
