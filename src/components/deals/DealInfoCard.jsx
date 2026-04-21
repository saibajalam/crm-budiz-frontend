import { useEffect, useMemo, useState } from "react";
import Card from "components/card";
import { useUpdateDeal } from "domains/deals/hooks";

const initialForm = {
  name: "",
  value: "",
  stage: "",
  contact: "",
  status: "",
  assigned_user: "",
};

export default function DealInfoCard({ deal, stageOptions = [] }) {
  const [form, setForm] = useState(initialForm);
  const updateDealMutation = useUpdateDeal();

  useEffect(() => {
    if (!deal) return;

    setForm({
      name: deal.name || "",
      value: deal.value ?? "",
      stage:
        (typeof deal.stage === "object" ? deal.stage.id : deal.stage_id || deal.stage || "") + "",
      contact: deal.contact || "",
      status: deal.status || "",
      assigned_user:
        deal.assigned_user_name || deal.assigned_user || deal.owner_name || deal.owner || "",
    });
  }, [deal]);

  const hasChanges = useMemo(() => {
    if (!deal) return false;
    const currentStage =
      (typeof deal.stage === "object" ? deal.stage.id : deal.stage_id || deal.stage || "") + "";

    return (
      form.name !== (deal.name || "") ||
      String(form.value) !== String(deal.value ?? "") ||
      form.stage !== currentStage ||
      form.contact !== (deal.contact || "") ||
      form.status !== (deal.status || "") ||
      form.assigned_user !==
        (deal.assigned_user_name || deal.assigned_user || deal.owner_name || deal.owner || "")
    );
  }, [deal, form]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!deal?.id) return;

    updateDealMutation.mutate({
      id: deal.id,
      data: {
        name: form.name,
        value: Number(form.value || 0),
        stage: form.stage || null,
        contact: form.contact,
        status: form.status,
        assigned_user: form.assigned_user,
      },
    });
  };

  return (
    <Card extra="h-full rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">Deal Information</h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || updateDealMutation.isPending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateDealMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Deal Name
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </label>

        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Value
          <input
            type="number"
            value={form.value}
            onChange={(e) => handleChange("value", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </label>

        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Stage
          <select
            value={form.stage}
            onChange={(e) => handleChange("stage", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          >
            {stageOptions.length === 0 ? (
              <option value="">No stage options</option>
            ) : (
              stageOptions.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Contact
          <input
            value={form.contact}
            onChange={(e) => handleChange("contact", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </label>

        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Status
          <input
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </label>

        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Assigned User
          <input
            value={form.assigned_user}
            onChange={(e) => handleChange("assigned_user", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-navy-900 dark:text-gray-300">
        <p>
          Created: {deal?.created_at ? new Date(deal.created_at).toLocaleString() : "-"}
        </p>
        <p className="mt-1">
          Last updated: {deal?.updated_at ? new Date(deal.updated_at).toLocaleString() : "-"}
        </p>
      </div>
    </Card>
  );
}
