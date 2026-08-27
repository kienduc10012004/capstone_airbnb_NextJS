"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PinkRouteLoader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Khi pathname hoặc searchParams thay đổi -> kết thúc loading
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        anchor.target !== "_blank"
      ) {
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (href !== currentUrl) {
          setLoading(true);
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  if (!loading) return null;

  return (
    <div
      aria-busy="true"
      aria-label="Đang chuyển trang"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col items-center"
      role="status"
    >
      {/* Top progress bar màu hồng */}
      <div className="h-1 w-full overflow-hidden bg-rose-100">
        <div className="h-full w-full origin-left animate-[pulse_1s_infinite] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-[0_0_10px_#f43f5e]" />
      </div>

      {/* Top right floating pink spinner */}
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/95 px-3 py-1.5 text-xs font-bold text-rose-600 shadow-lg backdrop-blur-md dark:border-rose-500/30 dark:bg-slate-900/95 dark:text-rose-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-r-rose-500 motion-reduce:animate-none" />
        <span>Đang tải...</span>
      </div>
    </div>
  );
};

export default PinkRouteLoader;
