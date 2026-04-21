import { useMemo } from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import LineChart from "components/charts/LineChart";
import PieChart from "components/charts/PieChart";
import { useActivityAnalytics, useContactAnalytics, useDealAnalytics } from "domains/analytics/hooks";

const emptyLineOptions = {
  chart: { toolbar: { show: false } },
  stroke: { curve: "smooth" },
  legend: { show: false },
  yaxis: { show: false },
  xaxis: { categories: [] },
  grid: { show: false },
};

const emptyBarOptions = {
  chart: { toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 8, columnWidth: "42%" } },
  xaxis: { categories: [] },
  yaxis: { show: false },
  legend: { show: false },
  grid: { show: false },
};

const emptyPieOptions = {
  labels: [],
  legend: { position: "bottom" },
};

const formatPercent = (value) => `${Number(value || 0).toFixed(0)}%`;

const kpiCardClass = "rounded-2xl border border-gray-200 p-4 dark:!border-white/10 dark:bg-navy-800";

export default function AnalyticsDashboard() {
  const { data: dealData, isLoading: dealsLoading } = useDealAnalytics();
  const { data: activityData, isLoading: activitiesLoading } = useActivityAnalytics();
  const { data: contactData, isLoading: contactsLoading } = useContactAnalytics();

  const stageFunnelSeries = useMemo(() => {
    const data = Array.isArray(dealData?.funnel) ? dealData.funnel : [];
    return [{ name: "Deals", data: data.map((item) => Number(item.count || 0)) }];
  }, [dealData]);

  const stageFunnelOptions = useMemo(() => {
    const data = Array.isArray(dealData?.funnel) ? dealData.funnel : [];
    return {
      ...emptyBarOptions,
      xaxis: { categories: data.map((item) => item.stage) },
      colors: ["#3965FF"],
    };
  }, [dealData]);

  const activitiesLineSeries = useMemo(() => {
    const data = Array.isArray(activityData?.activitiesPerDay) ? activityData.activitiesPerDay : [];
    return [{ name: "Activities", data: data.map((item) => Number(item.count || 0)) }];
  }, [activityData]);

  const activitiesLineOptions = useMemo(() => {
    const data = Array.isArray(activityData?.activitiesPerDay) ? activityData.activitiesPerDay : [];
    return {
      ...emptyLineOptions,
      xaxis: { categories: data.map((item) => item.date) },
      colors: ["#0EA5E9"],
      tooltip: { theme: "dark" },
    };
  }, [activityData]);

  const activityPieSeries = useMemo(() => {
    const data = Array.isArray(activityData?.activityDistribution) ? activityData.activityDistribution : [];
    return data.map((item) => Number(item.count || 0));
  }, [activityData]);

  const activityPieOptions = useMemo(() => {
    const data = Array.isArray(activityData?.activityDistribution) ? activityData.activityDistribution : [];
    return {
      ...emptyPieOptions,
      labels: data.map((item) => item.type),
      colors: ["#22C55E", "#F59E0B", "#8B5CF6", "#0EA5E9", "#EF4444"],
    };
  }, [activityData]);

  const leadScoreDistributionSeries = useMemo(() => {
    const data = Array.isArray(contactData?.leadScoreDistribution) ? contactData.leadScoreDistribution : [];
    return data.map((item) => Number(item.count || 0));
  }, [contactData]);

  const leadScoreDistributionOptions = useMemo(() => {
    const data = Array.isArray(contactData?.leadScoreDistribution) ? contactData.leadScoreDistribution : [];
    return {
      ...emptyPieOptions,
      labels: data.map((item) => item.bucket),
      colors: ["#22C55E", "#F59E0B", "#EF4444"],
    };
  }, [contactData]);

  const loading = dealsLoading || activitiesLoading || contactsLoading;

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">CRM Intelligence Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Real-time sales performance, activity intelligence, and contact engagement insights.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card extra={kpiCardClass}>
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Deals</p>
          <p className="mt-2 text-3xl font-bold text-navy-700 dark:text-white">{dealData?.totalDeals ?? 0}</p>
        </Card>
        <Card extra={kpiCardClass}>
          <p className="text-xs uppercase tracking-wide text-gray-500">Win Rate</p>
          <p className="mt-2 text-3xl font-bold text-emerald-500">{formatPercent(dealData?.winRate)}</p>
        </Card>
        <Card extra={kpiCardClass}>
          <p className="text-xs uppercase tracking-wide text-gray-500">Lost Rate</p>
          <p className="mt-2 text-3xl font-bold text-rose-500">{formatPercent(dealData?.lostRate)}</p>
        </Card>
        <Card extra={kpiCardClass}>
          <p className="text-xs uppercase tracking-wide text-gray-500">Average Deal Value</p>
          <p className="mt-2 text-3xl font-bold text-navy-700 dark:text-white">
            ${Number(dealData?.averageDealValue || 0).toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">Stage Conversion Funnel</h3>
          <div className="mt-4 h-[300px] w-full">
            <BarChart chartData={stageFunnelSeries} chartOptions={stageFunnelOptions} />
          </div>
        </Card>

        <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">Activities Per Day</h3>
          <div className="mt-4 h-[300px] w-full">
            <LineChart series={activitiesLineSeries} options={activitiesLineOptions} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">Activity Type Distribution</h3>
          <div className="mt-4 h-[260px]">
            <PieChart series={activityPieSeries} options={activityPieOptions} />
          </div>
        </Card>

        <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">Lead Score Distribution</h3>
          <div className="mt-4 h-[260px]">
            <PieChart series={leadScoreDistributionSeries} options={leadScoreDistributionOptions} />
          </div>
        </Card>

        <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">User Activity Ranking</h3>
          <div className="mt-4 space-y-2">
            {(activityData?.userRanking || []).slice(0, 8).map((entry, idx) => (
              <div key={`${entry.user}-${idx}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-navy-900">
                <p className="text-sm font-semibold text-navy-700 dark:text-white">{entry.user}</p>
                <p className="text-xs font-bold text-brand-500">{entry.count}</p>
              </div>
            ))}
            {(activityData?.userRanking || []).length === 0 ? (
              <p className="text-sm text-gray-500">No user activity yet</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card extra="rounded-2xl border border-gray-200 p-5 dark:!border-white/10 dark:bg-navy-800">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">Most Engaged Contacts</h3>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(contactData?.mostEngagedContacts || []).slice(0, 9).map((contact, idx) => (
            <div key={`${contact.contactId}-${idx}`} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900">
              <p className="text-sm font-semibold text-navy-700 dark:text-white">{contact.name}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                Engagement score: {contact.engagement}
              </p>
            </div>
          ))}
          {(contactData?.mostEngagedContacts || []).length === 0 ? (
            <p className="text-sm text-gray-500">No engagement data yet</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
