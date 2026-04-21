import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DealCard from "./DealCard";

export default function Column({ stage, deals }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: {
      type: "stage",
      stageId: stage.id,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[460px] flex-col rounded-2xl border border-gray-200 bg-white/60 p-3 transition-all dark:border-white/10 dark:bg-navy-800/60 ${
        isOver ? "ring-2 ring-brand-500" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-700 dark:text-white">{stage.name}</h3>
        <span className="rounded-full bg-lightPrimary px-2 py-1 text-xs font-semibold text-brand-500 dark:bg-navy-700 dark:text-white">
          {deals.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <SortableContext items={deals.map((deal) => String(deal.id))} strategy={verticalListSortingStrategy}>
          {deals.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 dark:border-white/20 dark:text-gray-400">
              Drop deals here
            </div>
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} stageId={stage.id} />)
          )}
        </SortableContext>
      </div>
    </section>
  );
}
