import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { getPipelineStages, getPipelines } from "./service";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";

export const usePipelines = () => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: [QUERY_KEYS.PIPELINES, workspaceId],
    queryFn: getPipelines,
  });
};

export const usePipelineStages = (pipelineId) => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: [QUERY_KEYS.PIPELINE_STAGES, workspaceId, pipelineId],
    queryFn: () => getPipelineStages(pipelineId),
    enabled: !!pipelineId,
  });
};
