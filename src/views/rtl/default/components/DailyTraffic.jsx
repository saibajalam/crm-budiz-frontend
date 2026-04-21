import BarChart from "components/charts/BarChart";
import { MdArrowDropUp } from "react-icons/md";
import Card from "components/card";
import { useDailyTraffic } from "domains/dashboard/hooks";

const DailyTraffic = () => {
  const { data, isLoading } = useDailyTraffic();

  const chartData = data?.chart_data || [{ name: "Daily Traffic", data: [] }];
  const chartOptions = data?.chart_options || {
    chart: { toolbar: { show: false } },
    tooltip: { theme: "dark" },
    xaxis: { categories: [] },
    plotOptions: { bar: { borderRadius: 10, columnWidth: "40px" } },
    colors: ["#6AD2FF"],
  };

  return (
    <Card extra="pb-7 p-[20px]">
      <div className="flex flex-row justify-between">
        <div className="pt-2 ms-1">
          <p className="text-sm font-medium leading-4 text-gray-600">
            Daily Traffic
          </p>
          <p className="text-[34px] font-bold text-navy-700 dark:text-white">
            {isLoading ? "..." : data?.visitors ?? "—"}{" "}
            <span className="text-sm font-medium leading-6 text-gray-600">
              Visitors
            </span>
          </p>
        </div>
        <div className="mt-2 flex items-start">
          <div className="flex items-center text-sm text-green-500">
            <MdArrowDropUp className="h-5 w-5" />
            <p className="font-bold"> {data?.growth ?? "+0%"} </p>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full pt-10 pb-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <BarChart chartData={chartData} chartOptions={chartOptions} />
        )}
      </div>
    </Card>
  );
};

export default DailyTraffic;
