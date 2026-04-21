import { useNavigate, useParams } from "react-router-dom";
import Card from "components/card";
import LeadScoreBadge from "components/contacts/LeadScoreBadge";
import { useContact } from "domains/contacts/hooks";
import { useContactScore } from "domains/scoring/hooks";

export default function ContactDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const contactId = id ? Number(id) : null;
  const { data: contact, isLoading, error, refetch } = useContact(contactId);
  const { data: scoreData } = useContactScore(contactId, { enabled: !!contactId });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-500">{error?.message || "Failed to load contact"}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/data-tables")}
          className="text-xs font-semibold uppercase tracking-wide text-brand-500"
        >
          Back to contacts
        </button>
        <h2 className="mt-1 text-2xl font-bold text-navy-700 dark:text-white">
          {contact?.name || contact?.email || `Contact ${contactId}`}
        </h2>
      </div>

      <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">Contact Intelligence</h3>
          <LeadScoreBadge score={scoreData?.score || 0} level={scoreData?.level || "low"} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
            <p className="mt-1 text-sm text-navy-700 dark:text-white">{contact?.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
            <p className="mt-1 text-sm text-navy-700 dark:text-white">{contact?.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Company</p>
            <p className="mt-1 text-sm text-navy-700 dark:text-white">{contact?.company || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
            <p className="mt-1 text-sm text-navy-700 dark:text-white">
              {contact?.created_at ? new Date(contact.created_at).toLocaleString() : "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-navy-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Score Breakdown</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <p>Deals: {scoreData?.breakdown?.dealsScore ?? 0}</p>
            <p>Value: {scoreData?.breakdown?.valueScore ?? 0}</p>
            <p>Activities: {scoreData?.breakdown?.activityScore ?? 0}</p>
            <p>Progression: {scoreData?.breakdown?.progressionScore ?? 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
