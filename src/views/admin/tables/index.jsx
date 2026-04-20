import { useQuery } from "@tanstack/react-query";
import CheckTable from "./components/CheckTable";
import DevelopmentTable from "./components/DevelopmentTable";
import ColumnsTable from "./components/ColumnsTable";
import ComplexTable from "./components/ComplexTable";
import { leadsService } from "api/services/leads.service";
import { dealsService } from "api/services/deals.service";
import { contactsService } from "api/services/contacts.service";
import { activitiesService } from "api/services/activities.service";

const Tables = () => {
  const { data: leadsRaw, isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadsService.getAll(),
  });
  const { data: dealsRaw } = useQuery({
    queryKey: ["deals"],
    queryFn: () => dealsService.getAll(),
  });
  const { data: contactsRaw } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsService.getAll(),
  });
  const { data: activitiesRaw } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesService.getAll(),
  });

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
