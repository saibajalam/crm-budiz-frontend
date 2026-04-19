import { useEffect, useState } from "react";
import { getLeads } from "./api";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getLeads();
      setLeads(data);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Leads</h2>
      {leads.map((lead) => (
        <div key={lead.id}>{lead.name}</div>
      ))}
    </div>
  );
}