"use client";

import { useEffect } from "react";

import { useToastStore, type ToastTone } from "@/app/store/useToastStore";

const TOAST_DURATION = 3500;

type ToastItemProps = {
  id: number;
  message: string;
  tone: ToastTone;
};

const getToneStyles = (tone: ToastTone) => {
  switch (tone) {
    case "success":
      return {
        badge: "border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#1a2236] text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10",
        icon: "fa-solid fa-circle-check text-emerald-500",
      };
    case "error":
      return {
        badge: "border-red-200 dark:border-red-500/30 bg-white dark:bg-[#1a2236] text-red-700 dark:text-red-300 shadow-red-500/10",
        icon: "fa-solid fa-circle-xmark text-red-500",
      };
    case "info":
      return {
        badge: "border-blue-200 dark:border-blue-500/30 bg-white dark:bg-[#1a2236] text-blue-700 dark:text-blue-300 shadow-blue-500/10",
        icon: "fa-solid fa-circle-info text-blue-500",
      };
    case "rose":
    default:
      return {
        badge: "border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#1a2236] text-rose-700 dark:text-rose-300 shadow-rose-500/10",
        icon: "fa-solid fa-heart text-rose-500",
      };
  }
};

const ToastItem = ({ id, message, tone }: ToastItemProps) => {
  const hideToast = useToastStore((state) => state.hideToast);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => hideToast(id), TOAST_DURATION);
    return () => window.clearTimeout(timeoutId);
  }, [hideToast, id]);

  const { badge, icon } = getToneStyles(tone);

  return (
    <div
      className={`pointer-events-auto flex w-fit max-w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md transition-all duration-300 ease-out starting:translate-x-4 starting:opacity-0 ${badge}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <i aria-hidden="true" className={`${icon} text-base shrink-0`} />
      <span className="leading-snug">{message}</span>
      <button
        aria-label="Đóng thông báo"
        className="ml-2 grid h-5 w-5 place-items-center rounded-full text-xs opacity-60 hover:opacity-100 transition-opacity"
        type="button"
        onClick={() => hideToast(id)}
      >
        ×
      </button>
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
      className="pointer-events-none fixed top-20 right-3 left-3 z-[150] flex flex-col items-end gap-2.5 sm:top-22 sm:right-6 sm:left-auto sm:max-w-sm"
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
