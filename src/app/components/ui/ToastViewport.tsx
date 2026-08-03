"use client";

import { useEffect } from "react";

import { useToastStore } from "@/app/store/useToastStore";

const TOAST_DURATION = 2200;

type ToastItemProps = {
  id: number;
  message: string;
  tone: "rose" | "success";
};

const ToastItem = ({ id, message, tone }: ToastItemProps) => {
  const hideToast = useToastStore((state) => state.hideToast);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => hideToast(id), TOAST_DURATION);
    return () => window.clearTimeout(timeoutId);
  }, [hideToast, id]);

  const success = tone === "success";

  return (
    <div
      className={`pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-300 ease-out starting:-translate-y-2 starting:opacity-0 ${
        success
          ? "border-green-100 text-green-600"
          : "border-rose-100 text-rose-500"
      }`}
      role="status"
    >
      <i
        aria-hidden="true"
        className={success ? "fa-solid fa-circle-check" : "fa-regular fa-heart"}
      />
      <span>{message}</span>
    </div>
  );
};

const ToastViewport = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-atomic="false"
      aria-live="polite"
      className="pointer-events-none fixed top-20 right-3 left-3 z-[150] flex flex-col items-end gap-2 sm:top-22 sm:right-6 sm:left-auto sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastItem
          id={toast.id}
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
        />
      ))}
    </div>
  );
};

export default ToastViewport;
