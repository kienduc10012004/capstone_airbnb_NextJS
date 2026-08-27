"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocations, getLocationsPaged } from "@/app/lib/api";

export const LOCATION_KEYS = {
  all: ["locations"] as const,
  list: () => [...LOCATION_KEYS.all, "list"] as const,
  paged: (page: number, keyword?: string) =>
    [...LOCATION_KEYS.all, "paged", { page, keyword }] as const,
};

export const useLocationsQuery = () => {
  return useQuery({
    queryKey: LOCATION_KEYS.list(),
    queryFn: async () => {
      const res = await getLocations();
      return res.content;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

export const useLocationsPagedQuery = (page: number, keyword?: string) => {
  return useQuery({
    queryKey: LOCATION_KEYS.paged(page, keyword),
    queryFn: async () => {
      const res = await getLocationsPaged({
        keyword: keyword || undefined,
        pageIndex: page,
        pageSize: 8,
      });
      return res.content;
    },
  });
};
