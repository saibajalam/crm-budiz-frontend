import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ActivityTimeline from "components/deals/ActivityTimeline";
import DealInfoCard from "components/deals/DealInfoCard";
import NotesPanel from "components/deals/NotesPanel";
import RelatedContactsPanel from "components/deals/RelatedContactsPanel";
import {
  useDeal,
  useDealActivities,
  useDealRealtime,
  useDeals,
} from "domains/deals/hooks";
import { usePipelineStages, usePipelines } from "domains/pipelines/hooks";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

export default function DealDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activityFilters, setActivityFilters] = useState({
    type: "ALL",
    q: "",
    user: "",
    from: "",
    to: "",
  });

  const dealId = id ? Number(id) : null;

  const { data: deal, isLoading: dealLoading, error: dealError, refetch: refetchDeal } = useDeal(dealId);
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useDealActivities(dealId, activityFilters);

  const { data: pipelinesData } = usePipelines();
  const pipelines = normalizeList(pipelinesData);

  const fallbackPipelineId = pipelines[0]?.id;
  const stagePipelineId =
    deal?.pipeline_id || deal?.pipeline || deal?.stage?.pipeline || deal?.stage_pipeline_id || fallbackPipelineId;

  const { data: stagesData } = usePipelineStages(stagePipelineId);
  const stageOptions = normalizeList(stagesData).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  useDeals({ pipeline_id: stagePipelineId }, { enabled: !!stagePipelineId });
  useDealRealtime(dealId);

  const hasError = !!dealError || !!activitiesError;

  const content = useMemo(() => {
    if (dealLoading) {
      return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="h-[520px] animate-pulse rounded-2xl bg-gray-100 xl:col-span-2 dark:bg-white/5" />
          <div className="h-[520px] animate-pulse rounded-2xl bg-gray-100 xl:col-span-3 dark:bg-white/5" />
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="py-16 text-center">
          <p className="text-red-500">{dealError?.message || activitiesError?.message || "Failed to load deal"}</p>
          <button
            onClick={() => {
              refetchDeal();
              refetchActivities();
            }}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="space-y-5">
            <DealInfoCard deal={deal} stageOptions={stageOptions} />
            <RelatedContactsPanel dealId={dealId} />
          </div>
        </div>

        <div className="space-y-5 xl:col-span-3">
          <div className="transition-all duration-200">
            <ActivityTimeline
              data={activitiesData}
              isLoading={activitiesLoading}
              filters={activityFilters}
              onFiltersChange={setActivityFilters}
            />
          </div>
          <div className="transition-all duration-200">
            <NotesPanel dealId={dealId} activitiesData={activitiesData} />
          </div>
        </div>
      </div>
    );
  }, [
    activitiesData,
    activitiesError,
    activitiesLoading,
    activityFilters,
    deal,
    dealError,
    dealId,
    dealLoading,
    hasError,
    refetchActivities,
    refetchDeal,
    stageOptions,
  ]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/deals-pipeline")}
            className="text-xs font-semibold uppercase tracking-wide text-brand-500"
          >
            Back to pipeline
          </button>
          <h2 className="mt-1 text-2xl font-bold text-navy-700 dark:text-white">
            {deal?.name || "Deal Detail"}
          </h2>
        </div>
      </div>

      {content}
    </div>
  );
}
