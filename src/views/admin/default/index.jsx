import { useQuery } from "@tanstack/react-query";
import MiniCalendar from "components/calendar/MiniCalendar";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import TotalSpent from "views/admin/default/components/TotalSpent";
import PieChartCard from "views/admin/default/components/PieChartCard";
import { IoMdHome } from "react-icons/io";
import { IoDocuments } from "react-icons/io5";
import { MdBarChart, MdDashboard } from "react-icons/md";

import Widget from "components/widget/Widget";
import CheckTable from "views/admin/default/components/CheckTable";
import ComplexTable from "views/admin/default/components/ComplexTable";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import TaskCard from "views/admin/default/components/TaskCard";
import { dashboardService } from "api/services/dashboard.service";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardService.getStats,
  });

  const { data: checkData } = useQuery({
    queryKey: ["dashboard", "checkTable"],
    queryFn: dashboardService.getCheckTableData,
  });

  const { data: complexData } = useQuery({
    queryKey: ["dashboard", "complexTable"],
    queryFn: dashboardService.getComplexTableData,
  });

  const checkTableData = Array.isArray(checkData) ? checkData : checkData?.data || [];
  const complexTableData = Array.isArray(complexData) ? complexData : complexData?.data || [];

  if (statsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center">
        <p className="text-lg text-red-500">{statsError.message || "Failed to load dashboard data"}</p>
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
      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Earnings"}
          subtitle={stats?.earnings ?? "—"}
        />
        <Widget
          icon={<IoDocuments className="h-6 w-6" />}
          title={"Spend this month"}
          subtitle={stats?.spend_this_month ?? "—"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Sales"}
          subtitle={stats?.sales ?? "—"}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Your Balance"}
          subtitle={stats?.balance ?? "—"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"New Tasks"}
          subtitle={stats?.new_tasks ?? "—"}
        />
        <Widget
          icon={<IoMdHome className="h-6 w-6" />}
          title={"Total Projects"}
          subtitle={stats?.total_projects ?? "—"}
        />
      </div>

      {/* Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TotalSpent />
        <WeeklyRevenue />
      </div>

      {/* Tables & Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Check Table */}
        <div>
          <CheckTable tableData={checkTableData} />
        </div>

        {/* Traffic chart & Pie Chart */}

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <DailyTraffic />
          <PieChartCard />
        </div>

        {/* Complex Table , Task & Calendar */}

        <ComplexTable tableData={complexTableData} />

        {/* Task chart & Calendar */}

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TaskCard />
          <div className="grid grid-cols-1 rounded-[20px]">
            <MiniCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
