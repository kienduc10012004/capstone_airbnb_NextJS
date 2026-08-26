"use client";

import { useEffect, type ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

const Modal = ({
  children,
  description,
  onClose,
  open,
  size = "md",
  title,
}: ModalProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      onMouseDown={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white dark:bg-[#1a2236] shadow-2xl border border-gray-200/80 dark:border-white/10 sm:rounded-3xl ${sizes[size]}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#1a2236] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200/90 dark:border-white/15 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all shadow-xs"
            type="button"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
