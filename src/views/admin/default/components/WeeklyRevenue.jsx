import Card from "components/card";
import BarChart from "components/charts/BarChart";
import { MdBarChart } from "react-icons/md";
import { useWeeklyRevenue } from "domains/dashboard/hooks";

const WeeklyRevenue = () => {
  const { data, isLoading } = useWeeklyRevenue();

  const chartData = data?.chart_data || [{ name: "Revenue", data: [] }];
  const chartOptions = data?.chart_options || {
    chart: { toolbar: { show: false } },
    tooltip: { theme: "dark" },
    xaxis: { categories: [] },
    plotOptions: { bar: { borderRadius: 10, columnWidth: "40px" } },
    colors: ["#6AD2FF", "#4318FF", "#EFF4FB"],
  };

  return (
    <Card extra="flex flex-col bg-white w-full rounded-3xl py-6 px-2 text-center">
      <div className="mb-auto flex items-center justify-between px-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Weekly Revenue
        </h2>
        <button className="!linear z-[1] flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 !transition !duration-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/10">
          <MdBarChart className="h-6 w-6" />
        </button>
      </div>

      <div className="md:mt-16 lg:mt-0">
        <div className="h-[250px] w-full xl:h-[350px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <BarChart chartData={chartData} chartOptions={chartOptions} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default WeeklyRevenue;
