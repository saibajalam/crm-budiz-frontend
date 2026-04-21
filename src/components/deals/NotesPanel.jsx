import { useState } from "react";
import Card from "components/card";
import { useAddDealActivity, useAddDealNote } from "domains/deals/hooks";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

export default function NotesPanel({ dealId, activitiesData }) {
  const [note, setNote] = useState("");
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("CALL");

  const addNoteMutation = useAddDealNote();
  const addActivityMutation = useAddDealActivity();

  const activities = normalizeList(activitiesData);
  const notes = activities.filter((item) => item.type === "note" || item.note);

  const handleAddNote = () => {
    const value = note.trim();
    if (!value || !dealId) return;

    addNoteMutation.mutate({ id: dealId, note: value });
    setNote("");
  };

  const handleAddActivity = () => {
    const value = activityText.trim();
    if (!value || !dealId) return;

    addActivityMutation.mutate({
      id: dealId,
      activity: {
        type: activityType,
        message: value,
        metadata: {
          source: "deal_detail",
          category: activityType,
        },
      },
    });
    setActivityText("");
  };

  return (
    <Card extra="h-full rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
      <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Notes & Updates</h3>

      <div className="space-y-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add internal note..."
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={addNoteMutation.isPending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {addNoteMutation.isPending ? "Adding note..." : "Add Note"}
        </button>
      </div>

      <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-white/10">
        <select
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
        >
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">Meeting</option>
          <option value="STATUS_CHANGE">Status Change</option>
          <option value="NOTE">Note</option>
        </select>

        <textarea
          value={activityText}
          onChange={(e) => setActivityText(e.target.value)}
          rows={2}
          placeholder="Log call, meeting, or status update..."
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAddActivity}
          disabled={addActivityMutation.isPending}
          className="rounded-lg border border-brand-500 px-4 py-2 text-xs font-semibold text-brand-500 hover:bg-brand-50 dark:hover:bg-white/5 disabled:opacity-50"
        >
          {addActivityMutation.isPending ? "Logging..." : "Log Activity"}
        </button>
      </div>

      <div className="mt-5 max-h-[260px] space-y-2 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-white/20 dark:text-gray-400">
            No notes yet
          </p>
        ) : (
          notes.map((item, idx) => (
            <div
              key={item.id || idx}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900"
            >
              <p className="text-sm text-navy-700 dark:text-white">{item.note || item.message}</p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {item.user_name || item.user || "System"} · {new Date(item.created_at || Date.now()).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
