import api from "api/client";

export const getDashboardStats = async () => {
  const res = await api.get("/dashboard/stats/");
  return res.data?.data;
};

export const getDailyTraffic = async () => {
  const res = await api.get("/dashboard/daily-traffic/");
  return res.data?.data;
};

export const getWeeklyRevenue = async () => {
  const res = await api.get("/dashboard/weekly-revenue/");
  return res.data?.data;
};

export const getTotalSpent = async () => {
  const res = await api.get("/dashboard/total-spent/");
  return res.data?.data;
};

export const getPieChartData = async () => {
  const res = await api.get("/dashboard/file-storage/");
  return res.data?.data;
};

export const getDashboardTasks = async () => {
  const res = await api.get("/dashboard/tasks/");
  return res.data?.data;
};

export const getCheckTableData = async () => {
  const res = await api.get("/dashboard/check-table/");
  return res.data?.data;
};

export const getComplexTableData = async () => {
  const res = await api.get("/dashboard/complex-table/");
  return res.data?.data;
};
