"use client";

import { useEffect, useState } from "react";

import Button, { type ButtonVariant } from "@/app/components/ui/Button";

type ConfirmDialogProps = {
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  countdownSeconds?: number;
  description: string;
  iconClassName?: string;
  iconContainerClassName?: string;
  loading?: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmDialog = ({
  confirmLabel = "Xác nhận",
  confirmVariant = "primary",
  countdownSeconds = 0,
  description,
  iconClassName = "fa-solid fa-arrow-right-from-bracket",
  iconContainerClassName = "bg-rose-50 text-rose-500",
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(countdownSeconds);
      return;
    }

    setSecondsLeft(countdownSeconds);
    if (countdownSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [open, countdownSeconds]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  const isCountdownActive = secondsLeft > 0;
  const currentConfirmLabel = isCountdownActive
    ? `${confirmLabel} (${secondsLeft}s)`
    : confirmLabel;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-200"
      role="dialog"
      onMouseDown={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 text-center shadow-2xl transition-[opacity,scale] duration-200 ease-out"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`mx-auto grid h-12 w-12 place-items-center rounded-full text-xl ${iconContainerClassName}`}
        >
          <i aria-hidden="true" className={iconClassName} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-950 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button disabled={loading} variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            disabled={isCountdownActive}
            loading={loading}
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {currentConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
