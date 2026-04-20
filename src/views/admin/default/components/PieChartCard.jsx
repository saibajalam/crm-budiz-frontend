import { useQuery } from "@tanstack/react-query";
import PieChart from "components/charts/PieChart";
import Card from "components/card";
import { dashboardService } from "api/services/dashboard.service";

const PieChartCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "pieChart"],
    queryFn: dashboardService.getPieChartData,
  });

  const series = data?.series || [];
  const options = data?.options || {
    labels: ["Your Files", "System"],
    colors: ["#4318FF", "#6AD2FF"],
    chart: { width: "50px" },
    states: {
      hover: { filter: { type: "none" } },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    hover: { mode: null },
    plotOptions: { donut: { expandOnClick: false } },
    fill: { colors: ["#4318FF", "#6AD2FF"] },
    tooltip: { enabled: true, theme: "dark" },
  };

  const categories = data?.categories || [
    { label: "Your Files", color: "bg-brand-500", value: "—" },
    { label: "System", color: "bg-[#6AD2FF]", value: "—" },
  ];

  return (
    <Card extra="rounded-[20px] p-3">
      <div className="flex flex-row justify-between px-3 pt-2">
        <div>
          <h4 className="text-lg font-bold text-navy-700 dark:text-white">
            Your Pie Chart
          </h4>
        </div>

        <div className="mb-6 flex items-center justify-center">
          <select className="mb-3 mr-2 flex items-center justify-center text-sm font-bold text-gray-600 hover:cursor-pointer dark:!bg-navy-800 dark:text-white">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <div className="mb-auto flex h-[220px] w-full items-center justify-center">
        {isLoading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        ) : (
          <PieChart options={options} series={series} />
        )}
      </div>
      <div className="flex flex-row !justify-between rounded-2xl px-6 py-3 shadow-2xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
        {categories.map((cat, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <div className={`h-2 w-2 rounded-full ${cat.color}`} />
              <p className="ml-1 text-sm font-normal text-gray-600">{cat.label}</p>
            </div>
            <p className="mt-px text-xl font-bold text-navy-700 dark:text-white">
              {cat.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PieChartCard;
