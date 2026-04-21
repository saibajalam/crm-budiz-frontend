import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { getNormalizedWorkspaceData } from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";

export const useNormalizedWorkspaceData = (options = {}) => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: [QUERY_KEYS.AI_READY, workspaceId],
    queryFn: getNormalizedWorkspaceData,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
