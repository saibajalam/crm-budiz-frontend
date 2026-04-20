import api from "api/client";

export const dashboardService = {
  getStats: async () => {
    const res = await api.get("/dashboard/stats/");
    return res.data;
  },

  getDailyTraffic: async () => {
    const res = await api.get("/dashboard/daily-traffic/");
    return res.data;
  },

  getWeeklyRevenue: async () => {
    const res = await api.get("/dashboard/weekly-revenue/");
    return res.data;
  },

  getTotalSpent: async () => {
    const res = await api.get("/dashboard/total-spent/");
    return res.data;
  },

  getPieChartData: async () => {
    const res = await api.get("/dashboard/file-storage/");
    return res.data;
  },

  getTasks: async () => {
    const res = await api.get("/dashboard/tasks/");
    return res.data;
  },

  getCheckTableData: async () => {
    const res = await api.get("/dashboard/check-table/");
    return res.data;
  },

  getComplexTableData: async () => {
    const res = await api.get("/dashboard/complex-table/");
    return res.data;
  },
};
