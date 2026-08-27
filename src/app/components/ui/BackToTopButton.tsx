"use client";

import { useEffect, useState } from "react";

const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      aria-label="Cuộn lên đầu trang"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#f63299] text-white shadow-lg backdrop-blur-xs transition-all duration-500 ease-out ${
        visible
          ? "pointer-events-auto opacity-60 translate-y-0 scale-100 cursor-pointer hover:opacity-100 hover:scale-110 active:scale-95"
          : "pointer-events-none opacity-0 translate-y-6 scale-75"
      }`}
      type="button"
      onClick={scrollToTop}
    >
      <i aria-hidden="true" className="fa-solid fa-chevron-up text-base" />
    </button>
  );
};

export default BackToTopButton;
