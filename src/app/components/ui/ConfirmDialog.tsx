"use client";

import { useEffect } from "react";

import Button, { type ButtonVariant } from "@/app/components/ui/Button";

type ConfirmDialogProps = {
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
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
  description,
  iconClassName = "fa-solid fa-arrow-right-from-bracket",
  iconContainerClassName = "bg-rose-50 text-rose-500",
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) => {
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

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      onMouseDown={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl transition-[opacity,scale] duration-200 ease-out starting:scale-95 starting:opacity-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`mx-auto grid h-12 w-12 place-items-center rounded-full text-xl ${iconContainerClassName}`}
        >
          <i aria-hidden="true" className={iconClassName} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button disabled={loading} variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            loading={loading}
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
