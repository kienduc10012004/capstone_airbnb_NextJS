"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type LocationSearchBarProps = {
  initialKeyword?: string;
};

const LocationSearchBar = ({ initialKeyword = "" }: LocationSearchBarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Debouncing 2s khi người dùng gõ từ khóa
  useEffect(() => {
    if (keyword === initialKeyword) return;
    setIsDebouncing(true);

    const timer = setTimeout(() => {
      setIsDebouncing(false);
      const params = new URLSearchParams(searchParams.toString());
      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      } else {
        params.delete("keyword");
      }
      params.set("page", "1");
      router.push(`/locations?${params.toString()}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [keyword, initialKeyword, router, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDebouncing(false);
    const params = new URLSearchParams(searchParams.toString());
    if (keyword.trim()) {
      params.set("keyword", keyword.trim());
    } else {
      params.delete("keyword");
    }
    params.set("page", "1");
    router.push(`/locations?${params.toString()}`);
  };

  return (
    <form
      className="relative flex w-full items-center rounded-full border border-gray-200/80 dark:border-white/15 bg-white dark:bg-slate-900/90 px-4 py-2.5 shadow-md shadow-gray-200/50 dark:shadow-none transition-all duration-300 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 sm:max-w-md"
      onSubmit={handleSubmit}
    >
      <span aria-hidden="true" className="text-base text-rose-500 shrink-0 mr-3">
        <i className="fa-solid fa-magnifying-glass" />
      </span>
      <input
        className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
        placeholder="Tìm vị trí, tỉnh thành..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      {isDebouncing && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-rose-500 dark:text-rose-400 animate-pulse ml-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          Đang tìm...
        </span>
      )}
      {keyword && !isDebouncing && (
        <button
          aria-label="Xóa từ khóa"
          className="ml-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
          type="button"
          onClick={() => {
            setKeyword("");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("keyword");
            params.set("page", "1");
            router.push(`/locations?${params.toString()}`);
          }}
        >
          ×
        </button>
      )}
    </form>
  );
};

export default LocationSearchBar;
