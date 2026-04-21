import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Card from "components/card";
import { Link } from "react-router-dom";

export default function DealCard({ deal, stageId, isOverlay = false }) {
  const sortable = useSortable({
    id: String(deal.id),
    data: {
      type: "deal",
      dealId: deal.id,
      stageId,
    },
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.35 : 1,
      };

  return (
    <div
      ref={isOverlay ? undefined : sortable.setNodeRef}
      style={style}
      {...(isOverlay ? {} : sortable.attributes)}
      {...(isOverlay ? {} : sortable.listeners)}
      className={isOverlay ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"}
    >
      <Card extra="mb-3 rounded-xl border border-gray-200 p-3 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 dark:!border-white/10 dark:bg-navy-800">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-navy-700 dark:text-white">{deal.name || "Untitled Deal"}</p>
          {!isOverlay && deal?.id ? (
            <Link
              to={`/admin/deals/${deal.id}`}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded bg-lightPrimary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-500 dark:bg-navy-700 dark:text-white"
            >
              Open
            </Link>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Value: ${Number(deal.value || 0).toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Contact: {deal.contact || "-"}
        </p>
      </Card>
    </div>
  );
}
