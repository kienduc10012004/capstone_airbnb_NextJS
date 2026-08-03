"use client";

import { create } from "zustand";

type ToastMessage = {
  id: number;
  message: string;
  tone: "rose" | "success";
};

type ToastState = {
  toasts: ToastMessage[];
  hideToast: (id: number) => void;
  showToast: (message: string, tone?: ToastMessage["tone"]) => void;
};

let nextToastId = Date.now();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  showToast: (message, tone = "rose") =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: nextToastId++,
          message,
          tone,
        },
      ],
    })),
}));
