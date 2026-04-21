import { useQuery } from "@tanstack/react-query";
import {
  getCheckTableData,
  getComplexTableData,
  getDailyTraffic,
  getDashboardStats,
  getDashboardTasks,
  getPieChartData,
  getTotalSpent,
  getWeeklyRevenue,
} from "./service";

export const useDashboardStats = () => {
  return useQuery({ queryKey: ["dashboard", "stats"], queryFn: getDashboardStats });
};

export const useDashboardCheckTable = () => {
  return useQuery({ queryKey: ["dashboard", "checkTable"], queryFn: getCheckTableData });
};

export const useDashboardComplexTable = () => {
  return useQuery({ queryKey: ["dashboard", "complexTable"], queryFn: getComplexTableData });
};

export const useDailyTraffic = () => {
  return useQuery({ queryKey: ["dashboard", "dailyTraffic"], queryFn: getDailyTraffic });
};

export const useWeeklyRevenue = () => {
  return useQuery({ queryKey: ["dashboard", "weeklyRevenue"], queryFn: getWeeklyRevenue });
};

export const useTotalSpent = () => {
  return useQuery({ queryKey: ["dashboard", "totalSpent"], queryFn: getTotalSpent });
};

export const usePieChartData = () => {
  return useQuery({ queryKey: ["dashboard", "pieChart"], queryFn: getPieChartData });
};

export const useDashboardTasks = () => {
  return useQuery({ queryKey: ["dashboard", "tasks"], queryFn: getDashboardTasks });
};
