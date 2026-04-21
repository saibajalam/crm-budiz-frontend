import CheckTable from "./components/CheckTable";
import DevelopmentTable from "./components/DevelopmentTable";
import ColumnsTable from "./components/ColumnsTable";
import ComplexTable from "./components/ComplexTable";
import { useLeads } from "domains/leads/hooks";
import { useDeals } from "domains/deals/hooks";
import { useContacts } from "domains/contacts/hooks";
import { useActivities } from "domains/activities/hooks";

const Tables = () => {
  const { data: leadsRaw, isLoading: leadsLoading } = useLeads();
  const { data: dealsRaw } = useDeals();
  const { data: contactsRaw } = useContacts();
  const { data: activitiesRaw } = useActivities();

  const normalize = (d) => (Array.isArray(d) ? d : d?.results || d?.data || []);
  const leadsData = normalize(leadsRaw);
  const dealsData = normalize(dealsRaw);
  const contactsData = normalize(contactsRaw);
  const activitiesData = normalize(activitiesRaw);

  if (leadsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mt-5 grid h-full grid-cols-1 gap-5 md:grid-cols-2">
        <DevelopmentTable tableData={leadsData} />
        <CheckTable tableData={dealsData} />
      </div>

      <div className="mt-5 grid h-full grid-cols-1 gap-5 md:grid-cols-2">
        <ColumnsTable tableData={contactsData} />
        <ComplexTable tableData={activitiesData} />
      </div>
    </div>
  );
};

export default Tables;
