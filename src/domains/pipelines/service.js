import api from "api/client";

export const getPipelines = async () => {
  const res = await api.get("/pipelines/");
  return res.data?.data;
};

export const getPipelineStages = async (pipelineId) => {
  const res = await api.get("/pipeline-stages/", {
    params: { pipeline_id: pipelineId },
  });
  return res.data?.data;
};
