"use client";

import { useEffect } from "react";

import { getSession, refreshSessionCookies } from "@/app/lib/session";
import { useAuthStore } from "@/app/store/useAuthStore";

const AuthInitializer = () => {
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const session = getSession();
    if (session) {
      refreshSessionCookies(session);
    }
    setUser(session?.content.user ?? null);
    setHydrated(true);
  }, [setHydrated, setUser]);

  return null;
};

export default AuthInitializer;
