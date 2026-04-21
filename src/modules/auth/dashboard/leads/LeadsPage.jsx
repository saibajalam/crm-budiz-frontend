import { useState } from "react";
import {
  useCreateLead,
  useDeleteLead,
  useLeads,
  useUpdateLead,
} from "domains/leads/hooks";

export default function LeadsPage() {
  const [newLeadName, setNewLeadName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const { data: rawData, isLoading, error, refetch } = useLeads();
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  const leads = Array.isArray(rawData) ? rawData : rawData?.results || rawData?.data || [];

  const handleCreateLead = (e) => {
    e.preventDefault();
    const name = newLeadName.trim();
    if (!name) return;

    createLeadMutation.mutate({ name });
    setNewLeadName("");
  };

  const startEdit = (lead) => {
    setEditingId(lead.id);
    setEditingName(lead.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = (id) => {
    const name = editingName.trim();
    if (!name) return;

    updateLeadMutation.mutate(
      { id, payload: { name } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingName("");
        },
      }
    );
  };

  const handleDeleteLead = (id) => {
    deleteLeadMutation.mutate(id);
  };

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
          onClick={() => refetch()}
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

      <form onSubmit={handleCreateLead} className="mb-4 flex gap-2">
        <input
          value={newLeadName}
          onChange={(e) => setNewLeadName(e.target.value)}
          className="w-full rounded-lg border p-3 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          placeholder="Add new lead"
        />
        <button
          type="submit"
          disabled={createLeadMutation.isPending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {createLeadMutation.isPending ? "Adding..." : "Add"}
        </button>
      </form>

      {leads.length === 0 ? (
        <p className="text-gray-500">No leads found</p>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="mb-2 flex items-center justify-between gap-2 rounded-lg border p-3 dark:border-navy-700">
            {editingId === lead.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full rounded-lg border p-2 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            ) : (
              <span>{lead.name}</span>
            )}

            <div className="flex items-center gap-2">
              {editingId === lead.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => saveEdit(lead.id)}
                    className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                    disabled={updateLeadMutation.isPending}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(lead)}
                  className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                >
                  Edit
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteLead(lead.id)}
                className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600 disabled:opacity-50"
                disabled={deleteLeadMutation.isPending}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}