"use client";

import { create } from "zustand";

const FAVORITES_STORAGE_PREFIX = "airbnb:favorites";

type FavoritesState = {
  hydrated: boolean;
  roomIds: number[];
  userId: number | null;
  initialize: (userId: number | null) => void;
  toggleFavorite: (roomId: number) => void;
};

const getStorageKey = (userId: number) =>
  `${FAVORITES_STORAGE_PREFIX}:${userId}`;

const readFavoriteRoomIds = (userId: number) => {
  const rawFavorites = window.localStorage.getItem(getStorageKey(userId));
  if (!rawFavorites) return [];

  try {
    const roomIds = JSON.parse(rawFavorites) as unknown;
    if (!Array.isArray(roomIds)) return [];

    return Array.from(
      new Set(
        roomIds.filter(
          (roomId): roomId is number => Number.isInteger(roomId) && roomId > 0,
        ),
      ),
    );
  } catch {
    window.localStorage.removeItem(getStorageKey(userId));
    return [];
  }
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  hydrated: false,
  roomIds: [],
  userId: null,
  initialize: (userId) => {
    set({
      hydrated: true,
      roomIds: userId ? readFavoriteRoomIds(userId) : [],
      userId,
    });
  },
  toggleFavorite: (roomId) => {
    const { roomIds, userId } = get();
    if (!userId) return;

    const nextRoomIds = roomIds.includes(roomId)
      ? roomIds.filter((favoriteRoomId) => favoriteRoomId !== roomId)
      : [...roomIds, roomId];

    window.localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(nextRoomIds),
    );
    set({ roomIds: nextRoomIds });
  },
}));
