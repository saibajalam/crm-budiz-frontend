import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiPhone, FiUserPlus, FiX } from "react-icons/fi";
import Card from "components/card";
import { useContacts } from "domains/contacts/hooks";
import {
  useAddDealContact,
  useDealContacts,
  useDealContactsRealtime,
  useRemoveDealContact,
  useUpdateDealContact,
} from "domains/relationships/hooks";

const normalizeList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.results)) return rawData.results;
  if (Array.isArray(rawData?.data)) return rawData.data;
  return [];
};

export default function RelatedContactsPanel({ dealId }) {
  const [expanded, setExpanded] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [role, setRole] = useState("Decision Maker");

  const { data: linkedData } = useDealContacts(dealId);
  const linkedContacts = normalizeList(linkedData);

  const { data: contactsData } = useContacts({ page_size: 100 });
  const allContacts = normalizeList(contactsData);

  useDealContactsRealtime(dealId);

  const addMutation = useAddDealContact();
  const removeMutation = useRemoveDealContact();
  const updateMutation = useUpdateDealContact();

  const selectableContacts = useMemo(() => {
    const linkedIds = new Set(linkedContacts.map((item) => String(item.contact_id || item.id)));
    return allContacts.filter((contact) => !linkedIds.has(String(contact.id)));
  }, [allContacts, linkedContacts]);

  const handleAdd = () => {
    if (!dealId || !selectedContactId) return;

    const selectedContact = selectableContacts.find((c) => String(c.id) === String(selectedContactId));

    addMutation.mutate({
      dealId,
      payload: {
        contact_id: Number(selectedContactId),
        role,
        is_primary: linkedContacts.length === 0,
        name: selectedContact?.name,
        email: selectedContact?.email,
        phone: selectedContact?.phone,
      },
    });

    setSelectedContactId("");
  };

  const handleRemove = (contactId) => {
    removeMutation.mutate({ dealId, contactId });
  };

  const handlePrimaryToggle = (contact) => {
    updateMutation.mutate({
      dealId,
      contactId: contact.contact_id || contact.id,
      payload: {
        is_primary: !contact.is_primary,
      },
    });
  };

  return (
    <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">Related Contacts</h3>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-lg border border-gray-200 p-2 text-navy-700 dark:border-white/10 dark:text-white"
        >
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

      {expanded ? (
        <>
          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr,130px,110px]">
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              <option value="">Select contact</option>
              {selectableContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name || contact.email || `Contact #${contact.id}`}
                </option>
              ))}
            </select>

            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role in deal"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedContactId || addMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <FiUserPlus />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {linkedContacts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-white/20 dark:text-gray-400">
                No contacts linked to this deal yet.
              </p>
            ) : (
              linkedContacts.map((contact) => (
                <div
                  key={contact.contact_id || contact.id}
                  className={`rounded-xl border p-3 transition ${
                    contact._recentlyUpdated
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-400/40 dark:bg-emerald-500/10"
                      : "border-gray-200 bg-white dark:border-white/10 dark:bg-navy-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-navy-700 dark:text-white">
                        {contact.name || `Contact #${contact.contact_id || contact.id}`}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{contact.email || "No email"}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {contact.role || "Participant"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrimaryToggle(contact)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                          contact.is_primary
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 text-gray-600 dark:border-white/15 dark:text-gray-300"
                        }`}
                      >
                        {contact.is_primary ? "Primary" : "Make Primary"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(contact.contact_id || contact.id)}
                        className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 dark:border-red-400/20 dark:hover:bg-red-500/10"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                    <FiPhone />
                    <span>{contact.phone || "No phone"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </Card>
  );
}
