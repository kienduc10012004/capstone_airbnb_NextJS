"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getBookings,
  getLocationsPaged,
  getRooms,
  getUsersPaged,
} from "@/app/lib/api";

export const ADMIN_KEYS = {
  roomsPaged: (page: number, keyword?: string) =>
    ["admin", "rooms", { page, keyword }] as const,
  locationsPaged: (page: number, keyword?: string) =>
    ["admin", "locations", { page, keyword }] as const,
  usersPaged: (page: number, keyword?: string) =>
    ["admin", "users", { page, keyword }] as const,
  bookingsPaged: (page: number, keyword?: string) =>
    ["admin", "bookings", { page, keyword }] as const,
};

export const useAdminRoomsPagedQuery = (page: number, keyword = "") => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ADMIN_KEYS.roomsPaged(page, keyword),
    queryFn: async () => {
      const res = await getRooms(page, 12, keyword);
      return res.content;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.data && page < Math.ceil(query.data.totalRow / 12)) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ADMIN_KEYS.roomsPaged(nextPage, keyword),
        queryFn: async () => {
          const res = await getRooms(nextPage, 12, keyword);
          return res.content;
        },
      });
    }
  }, [page, keyword, query.data, queryClient]);

  return query;
};

export const useAdminLocationsPagedQuery = (page: number, keyword = "") => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ADMIN_KEYS.locationsPaged(page, keyword),
    queryFn: async () => {
      const res = await getLocationsPaged({
        keyword: keyword || undefined,
        pageIndex: page,
        pageSize: 12,
      });
      return res.content;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.data && page < Math.ceil(query.data.totalRow / 12)) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ADMIN_KEYS.locationsPaged(nextPage, keyword),
        queryFn: async () => {
          const res = await getLocationsPaged({
            keyword: keyword || undefined,
            pageIndex: nextPage,
            pageSize: 12,
          });
          return res.content;
        },
      });
    }
  }, [page, keyword, query.data, queryClient]);

  return query;
};

export const useAdminUsersPagedQuery = (page: number, keyword = "") => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ADMIN_KEYS.usersPaged(page, keyword),
    queryFn: async () => {
      const res = await getUsersPaged({
        keyword: keyword || undefined,
        pageIndex: page,
        pageSize: 10,
      });
      return res.content;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.data && page < Math.ceil(query.data.totalRow / 10)) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ADMIN_KEYS.usersPaged(nextPage, keyword),
        queryFn: async () => {
          const res = await getUsersPaged({
            keyword: keyword || undefined,
            pageIndex: nextPage,
            pageSize: 10,
          });
          return res.content;
        },
      });
    }
  }, [page, keyword, query.data, queryClient]);

  return query;
};

export const useAdminBookingsPagedQuery = (page: number, keyword = "") => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ADMIN_KEYS.bookingsPaged(page, keyword),
    queryFn: async () => {
      const res = await getBookings();
      const allBookings = res.content || [];
      const filtered = keyword
        ? allBookings.filter((b) =>
            String(b.id).includes(keyword) ||
            String(b.maPhong).includes(keyword) ||
            String(b.maNguoiDung).includes(keyword),
          )
        : allBookings;
      const start = (page - 1) * 10;
      return {
        data: filtered.slice(start, start + 10),
        totalRow: filtered.length,
      };
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.data && page < Math.ceil(query.data.totalRow / 10)) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ADMIN_KEYS.bookingsPaged(nextPage, keyword),
        queryFn: async () => {
          const res = await getBookings();
          const allBookings = res.content || [];
          const filtered = keyword
            ? allBookings.filter((b) =>
                String(b.id).includes(keyword) ||
                String(b.maPhong).includes(keyword) ||
                String(b.maNguoiDung).includes(keyword),
              )
            : allBookings;
          const start = (nextPage - 1) * 10;
          return {
            data: filtered.slice(start, start + 10),
            totalRow: filtered.length,
          };
        },
      });
    }
  }, [page, keyword, query.data, queryClient]);

  return query;
};
