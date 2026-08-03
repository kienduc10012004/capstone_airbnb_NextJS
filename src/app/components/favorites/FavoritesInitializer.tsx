"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/app/store/useAuthStore";
import { useFavoritesStore } from "@/app/store/useFavoritesStore";

const FavoritesInitializer = () => {
  const authHydrated = useAuthStore((state) => state.hydrated);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const initialize = useFavoritesStore((state) => state.initialize);

  useEffect(() => {
    if (authHydrated) initialize(userId);
  }, [authHydrated, initialize, userId]);

  return null;
};

export default FavoritesInitializer;
