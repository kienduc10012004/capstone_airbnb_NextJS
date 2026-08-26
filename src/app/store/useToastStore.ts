"use client";

import { create } from "zustand";

export type ToastTone = "error" | "info" | "rose" | "success";

export type ToastMessage = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastState = {
  toasts: ToastMessage[];
  hideToast: (id: number) => void;
  showToast: (message: string, tone?: ToastTone) => void;
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
