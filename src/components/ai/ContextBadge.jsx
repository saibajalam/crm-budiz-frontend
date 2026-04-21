export default function ContextBadge({ currentView, selectedEntityId }) {
  const label =
    currentView === "deal"
      ? "Viewing: Deal"
      : currentView === "contact"
      ? "Viewing: Contact"
      : currentView === "kanban"
      ? "Viewing: Kanban"
      : currentView === "dashboard"
      ? "Viewing: Dashboard"
      : currentView === "analytics"
      ? "Viewing: Analytics"
      : currentView === "graph"
      ? "Viewing: Graph"
      : "Viewing: Workspace";

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-lightPrimary px-3 py-1 text-xs font-semibold text-brand-500 dark:bg-navy-700 dark:text-white">
      <span>{label}</span>
      {selectedEntityId ? <span className="text-[11px] opacity-75">#{selectedEntityId}</span> : null}
    </div>
  );
}
