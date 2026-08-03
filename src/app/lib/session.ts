"use client";

import type { ApiSignInResponse, ApiUser } from "@/app/lib/api";

const SESSION_KEY = "user";
const SESSION_MAX_AGE = 60 * 60 * 24;

const setSessionCookies = (session: ApiSignInResponse) => {
  const token = encodeURIComponent(session.content.token);
  const role = encodeURIComponent(session.content.user.role);

  document.cookie = `token=${token}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;
  document.cookie = `userRole=${role}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;
};

export const setSession = (session: ApiSignInResponse) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setSessionCookies(session);
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "userRole=; path=/; max-age=0; SameSite=Lax";
};

export const getSession = (): ApiSignInResponse | null => {
  const rawSession = localStorage.getItem(SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as ApiSignInResponse;
  } catch {
    clearSession();
    return null;
  }
};

export const refreshSessionCookies = (session: ApiSignInResponse) => {
  setSessionCookies(session);
};

export const updateSession = (user: ApiUser) => {
  const session = getSession();
  if (!session) {
    return null;
  }

  const updatedSession = {
    ...session,
    content: { ...session.content, user },
  };
  setSession(updatedSession);
  return updatedSession;
};
