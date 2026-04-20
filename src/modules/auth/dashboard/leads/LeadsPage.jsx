import { useQuery } from "@tanstack/react-query";
import { leadsService } from "api/services/leads.service";

export default function LeadsPage() {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadsService.getAll(),
  });

  const leads = Array.isArray(rawData) ? rawData : rawData?.results || rawData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">{error.message || "Failed to load leads"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-navy-700 dark:text-white">Leads</h2>
      {leads.length === 0 ? (
        <p className="text-gray-500">No leads found</p>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="mb-2 rounded-lg border p-3 dark:border-navy-700">
            {lead.name}
          </div>
        ))
      )}
    </div>
  );
}