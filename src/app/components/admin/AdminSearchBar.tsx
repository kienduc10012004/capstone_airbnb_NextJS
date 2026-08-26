"use client";

import { useEffect, useState } from "react";

type AdminSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const AdminSearchBar = ({
  value,
  onChange,
  placeholder = "Tìm kiếm nhanh...",
  className = "",
}: AdminSearchBarProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (internalValue === value) return;
    setIsDebouncing(true);

    const timer = setTimeout(() => {
      setIsDebouncing(false);
      onChange(internalValue);
    }, 2000);

    return () => clearTimeout(timer);
  }, [internalValue, value, onChange]);

  const handleClear = () => {
    setInternalValue("");
    setIsDebouncing(false);
    onChange("");
  };

  return (
    <div
      className={`relative flex items-center rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#1a2236] px-4 py-2.5 shadow-sm transition-all focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 ${className}`}
    >
      {isDebouncing ? (
        <i
          aria-hidden="true"
          className="fa-solid fa-circle-notch animate-spin text-rose-500 text-sm shrink-0 mr-3"
        />
      ) : (
        <i
          aria-hidden="true"
          className="fa-solid fa-magnifying-glass text-gray-400 dark:text-slate-500 text-sm shrink-0 mr-3"
        />
      )}
      <input
        className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
      />

      {internalValue && (
        <button
          aria-label="Xóa từ khóa tìm kiếm"
          className="ml-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
          type="button"
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AdminSearchBar;
