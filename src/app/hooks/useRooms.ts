"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getAllRooms,
  getRoomById,
  getRooms,
  getRoomsByLocation,
} from "@/app/lib/api";

export const ROOM_KEYS = {
  all: ["rooms"] as const,
  list: () => [...ROOM_KEYS.all, "list"] as const,
  paged: (page: number, pageSize: number) =>
    [...ROOM_KEYS.all, "paged", { page, pageSize }] as const,
  byLocation: (locationId: number) =>
    [...ROOM_KEYS.all, "location", locationId] as const,
  detail: (roomId: number) => [...ROOM_KEYS.all, "detail", roomId] as const,
};

export const useAllRoomsQuery = () => {
  return useQuery({
    queryKey: ROOM_KEYS.list(),
    queryFn: async () => {
      const res = await getAllRooms();
      return res.content;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useRoomsPagedQuery = (page: number, pageSize = 8) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ROOM_KEYS.paged(page, pageSize),
    queryFn: async () => {
      const res = await getRooms(page, pageSize);
      return res.content;
    },
    placeholderData: keepPreviousData,
  });

  // Tự động Prefetch (tải trước) trang số tiếp theo ở background
  useEffect(() => {
    if (query.data && page < Math.ceil(query.data.totalRow / pageSize)) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ROOM_KEYS.paged(nextPage, pageSize),
        queryFn: async () => {
          const res = await getRooms(nextPage, pageSize);
          return res.content;
        },
      });
    }
  }, [page, pageSize, query.data, queryClient]);

  return query;
};

export const useRoomsByLocationQuery = (locationId: number) => {
  return useQuery({
    queryKey: ROOM_KEYS.byLocation(locationId),
    queryFn: async () => {
      const res = await getRoomsByLocation(locationId);
      return res.content;
    },
    enabled: Boolean(locationId),
  });
};

export const useRoomDetailQuery = (roomId: number) => {
  return useQuery({
    queryKey: ROOM_KEYS.detail(roomId),
    queryFn: async () => {
      const res = await getRoomById(roomId);
      return res;
    },
    enabled: Boolean(roomId),
  });
};
