"use client";

import { create } from "zustand";

import type { ApiUser } from "@/app/lib/api";

type AuthState = {
  user: ApiUser | null;
  hydrated: boolean;
  setUser: (user: ApiUser | null) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
