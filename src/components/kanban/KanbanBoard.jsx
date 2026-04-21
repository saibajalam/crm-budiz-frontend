import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import Column from "components/kanban/Column";
import DealCard from "components/kanban/DealCard";
import { useDeals, useDealsRealtime, useReorderDeal } from "domains/deals/hooks";
import { usePipelineStages, usePipelines } from "domains/pipelines/hooks";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

const getDealStageId = (deal) => {
  if (deal?.stage && typeof deal.stage === "object") return deal.stage.id;
  if (deal?.stage_id !== undefined && deal?.stage_id !== null) return deal.stage_id;
  return deal?.stage;
};

const getDealPosition = (deal, fallback) => {
  if (typeof deal?.position === "number") return deal.position;
  return fallback * 1000;
};

const mapDealsByStage = (deals, stages) => {
  const grouped = stages.reduce((acc, stage) => {
    acc[stage.id] = [];
    return acc;
  }, {});

  deals.forEach((deal, index) => {
    const stageId = getDealStageId(deal);
    if (!grouped[stageId]) return;
    grouped[stageId].push(deal);
  });

  Object.keys(grouped).forEach((stageId) => {
    grouped[stageId] = grouped[stageId].slice().sort((a, b) => {
      return getDealPosition(a, 0) - getDealPosition(b, 0);
    });
  });

  return grouped;
};

const computeMidpointPosition = (sortedDeals, targetIndex, movingDealId) => {
  const candidates = sortedDeals.filter((deal) => deal.id !== movingDealId);
  const previousDeal = candidates[targetIndex - 1];
  const nextDeal = candidates[targetIndex];

  if (!previousDeal && !nextDeal) return 1000;
  if (!previousDeal) return getDealPosition(nextDeal, 1) - 1000;
  if (!nextDeal) return getDealPosition(previousDeal, candidates.length) + 1000;

  return (
    (getDealPosition(previousDeal, targetIndex) + getDealPosition(nextDeal, targetIndex + 1)) /
    2
  );
};

const resolveDropTarget = (over, groupedDeals) => {
  if (!over) return null;

  const overData = over.data?.current;
  if (!overData) return null;

  if (overData.type === "stage") {
    return {
      stageId: overData.stageId,
      targetIndex: (groupedDeals[overData.stageId] || []).length,
      overDealId: null,
    };
  }

  if (overData.type === "deal") {
    const stageId = overData.stageId;
    const stageDeals = groupedDeals[stageId] || [];
    const targetIndex = stageDeals.findIndex((deal) => String(deal.id) === String(over.id));

    return {
      stageId,
      targetIndex: targetIndex < 0 ? stageDeals.length : targetIndex,
      overDealId: overData.dealId,
    };
  }

  return null;
};

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="min-h-[420px] animate-pulse rounded-2xl border border-gray-200 bg-white/60 p-3 dark:border-white/10 dark:bg-navy-800/60" />
      ))}
    </div>
  );
}

export default function KanbanBoard() {
  const [activeDealId, setActiveDealId] = useState(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [filters, setFilters] = useState({
    stage: "",
    minValue: "",
    maxValue: "",
    assignedUser: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: pipelinesData, isLoading: pipelinesLoading } = usePipelines();
  const pipelines = normalizeList(pipelinesData);

  const pipelineId = selectedPipelineId || pipelines[0]?.id || "";

  const {
    data: stagesData,
    isLoading: stagesLoading,
    error: stagesError,
    refetch: refetchStages,
  } = usePipelineStages(pipelineId);
  const stages = useMemo(() => normalizeList(stagesData).slice().sort((a, b) => a.order - b.order), [stagesData]);

  const {
    data: dealsData,
    isLoading: dealsLoading,
    error: dealsError,
    refetch: refetchDeals,
  } = useDeals(
    {
      pipeline_id: pipelineId,
      stage: filters.stage,
      min_value: filters.minValue,
      max_value: filters.maxValue,
      assigned_user: filters.assignedUser,
    },
    { enabled: !!pipelineId }
  );

  const deals = normalizeList(dealsData);
  const dealsByStage = useMemo(() => mapDealsByStage(deals, stages), [deals, stages]);
  const activeDeal = useMemo(
    () => deals.find((deal) => String(deal.id) === String(activeDealId)),
    [deals, activeDealId]
  );

  const reorderDealMutation = useReorderDeal();
  useDealsRealtime();

  const handleDragStart = (event) => {
    setActiveDealId(event.active.id);
  };

  const handleDragCancel = () => {
    setActiveDealId(null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveDealId(null);
    if (!over) return;

    const activeData = active.data?.current;
    if (!activeData || activeData.type !== "deal") return;

    const sourceStageId = activeData.stageId;
    const destination = resolveDropTarget(over, dealsByStage);
    if (!destination) return;

    const targetStageId = destination.stageId;

    if (!sourceStageId || !targetStageId) return;

    const sourceDeals = dealsByStage[sourceStageId] || [];
    const movingDeal = sourceDeals.find((deal) => deal.id === activeData.dealId);
    if (!movingDeal) return;

    const destinationDeals = dealsByStage[targetStageId] || [];
    const destinationWithoutMoving = destinationDeals.filter((deal) => deal.id !== movingDeal.id);

    const resolvedIndex = destination.overDealId
      ? destinationWithoutMoving.findIndex((deal) => deal.id === destination.overDealId)
      : destinationWithoutMoving.length;

    const safeIndex = resolvedIndex < 0 ? destinationWithoutMoving.length : resolvedIndex;
    const position = computeMidpointPosition(destinationDeals, safeIndex, movingDeal.id);

    reorderDealMutation.mutate({
      dealId: movingDeal.id,
      stage: targetStageId,
      position,
      updatedAt: movingDeal.updated_at,
    });
  };

  if (pipelinesLoading || stagesLoading || dealsLoading) {
    return <LoadingSkeleton />;
  }

  if (stagesError || dealsError) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">{stagesError?.message || dealsError?.message || "Failed to load pipeline"}</p>
        <button
          onClick={() => {
            refetchStages();
            refetchDeals();
          }}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Deals Pipeline</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Drag deals across stages. Changes are synced in real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select
            value={pipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white"
          >
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>

          <select
            value={filters.stage}
            onChange={(e) => setFilters((prev) => ({ ...prev, stage: e.target.value }))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white"
          >
            <option value="">All stages</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min value"
            value={filters.minValue}
            onChange={(e) => setFilters((prev) => ({ ...prev, minValue: e.target.value }))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white"
          />

          <input
            type="number"
            placeholder="Max value"
            value={filters.maxValue}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxValue: e.target.value }))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white"
          />

          <input
            placeholder="Assigned user"
            value={filters.assignedUser}
            onChange={(e) => setFilters((prev) => ({ ...prev, assignedUser: e.target.value }))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white"
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1200px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {stages.map((stage) => (
              <Column key={stage.id} stage={stage} deals={dealsByStage[stage.id] || []} />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeDeal ? <DealCard deal={activeDeal} stageId={getDealStageId(activeDeal)} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
