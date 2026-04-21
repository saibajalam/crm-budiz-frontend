import React from "react";
import {
  MdArrowDropUp,
  MdOutlineCalendarToday,
  MdBarChart,
} from "react-icons/md";
import Card from "components/card";
import LineChart from "components/charts/LineChart";
import { useTotalSpent } from "domains/dashboard/hooks";

const TotalSpent = () => {
  const { data, isLoading } = useTotalSpent();

  const series = data?.series || [{ name: "Revenue", data: [] }];
  const options = data?.options || {
    chart: { toolbar: { show: false }, dropShadow: { enabled: true, top: 13, left: 0, blur: 10, opacity: 0.1, color: "#4318FF" } },
    colors: ["#4318FF", "#39B8FF"],
    markers: { size: 0 },
    stroke: { curve: "smooth", type: "line" },
    xaxis: { categories: [] },
    yaxis: { show: false },
    legend: { show: false },
    grid: { show: false },
    tooltip: { theme: "dark" },
  };

  return (
    <Card extra="!p-[20px] text-center">
      <div className="flex justify-between">
        <button className="linear mt-1 flex items-center justify-center gap-2 rounded-lg bg-lightPrimary p-2 text-gray-600 transition duration-200 hover:cursor-pointer hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:hover:opacity-90 dark:active:opacity-80">
          <MdOutlineCalendarToday />
          <span className="text-sm font-medium text-gray-600">This month</span>
        </button>
        <button className="!linear z-[1] flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 !transition !duration-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/10">
          <MdBarChart className="h-6 w-6" />
        </button>
      </div>

      <div className="flex h-full w-full flex-row justify-between sm:flex-wrap lg:flex-nowrap 2xl:overflow-hidden">
        <div className="flex flex-col">
          <p className="mt-[20px] text-3xl font-bold text-navy-700 dark:text-white">
            {isLoading ? "..." : data?.total ?? "—"}
          </p>
          <div className="flex flex-col items-start">
            <p className="mt-2 text-sm text-gray-600">Total Spent</p>
            <div className="flex flex-row items-center justify-center">
              <MdArrowDropUp className="font-medium text-green-500" />
              <p className="text-sm font-bold text-green-500"> {data?.growth ?? "+0%"} </p>
            </div>
          </div>
        </div>
        <div className="h-full w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <LineChart options={options} series={series} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default TotalSpent;
