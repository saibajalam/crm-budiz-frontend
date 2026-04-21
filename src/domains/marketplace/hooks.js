import { useQuery } from "@tanstack/react-query";
import {
  getMarketplaceHistory,
  getMarketplaceRecent,
  getMarketplaceTopCreators,
  getMarketplaceTrending,
} from "./service";

export const useMarketplaceTrending = () => {
  return useQuery({
    queryKey: ["marketplace", "trending"],
    queryFn: getMarketplaceTrending,
  });
};

export const useMarketplaceRecent = () => {
  return useQuery({
    queryKey: ["marketplace", "recent"],
    queryFn: getMarketplaceRecent,
  });
};

export const useMarketplaceTopCreators = () => {
  return useQuery({
    queryKey: ["marketplace", "topCreators"],
    queryFn: getMarketplaceTopCreators,
  });
};

export const useMarketplaceHistory = () => {
  return useQuery({
    queryKey: ["marketplace", "history"],
    queryFn: getMarketplaceHistory,
  });
};
