"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { normalizeVietnameseSearch } from "@/app/components/search/date-utils";
import type { ApiLocation } from "@/app/lib/api";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";
import type { SearchSelectorVariant } from "@/app/components/search/types";

type LocationSelectorProps = {
  active: boolean;
  loading: boolean;
  locations: ApiLocation[];
  selectedId: number | null;
  variant: SearchSelectorVariant;
  onActivate: () => void;
  onSelect: (locationId: number) => void;
};

const LocationSelector = ({
  active,
  loading,
  locations,
  onActivate,
  onSelect,
  selectedId,
  variant,
}: LocationSelectorProps) => {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (keyword !== debouncedKeyword) {
      setIsDebouncing(true);
    }
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setIsDebouncing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [keyword, debouncedKeyword]);

  const selectedLocation = locations.find(
    (location) => location.id === selectedId,
  );

  const filteredLocations = useMemo(() => {
    const normalizedKeyword = normalizeVietnameseSearch(debouncedKeyword);
    if (!normalizedKeyword) {
      return locations;
    }
    return locations.filter((location) => {
      const tenViTri = normalizeVietnameseSearch(location.tenViTri);
      const tinhThanh = normalizeVietnameseSearch(location.tinhThanh);
      const quocGia = normalizeVietnameseSearch(location.quocGia);
      const combined = `${tenViTri}${tinhThanh}${quocGia}`;

      return (
        tenViTri.includes(normalizedKeyword) ||
        tinhThanh.includes(normalizedKeyword) ||
        quocGia.includes(normalizedKeyword) ||
        combined.includes(normalizedKeyword)
      );
    });
  }, [debouncedKeyword, locations]);

  const content = (
    <div className="p-5 sm:p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        Tìm kiếm theo địa điểm
      </h3>
      <label className="mt-4 flex items-center gap-3 rounded-xl border border-gray-900 dark:border-white/20 px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-rose-500">
        <span aria-hidden="true" className="text-xl text-gray-700 dark:text-slate-300">
          ⌕
        </span>
        <input
          autoFocus={variant === "desktop"}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
          placeholder="Tìm kiếm điểm đến"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        {isDebouncing && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-r-rose-500 motion-reduce:animate-none shrink-0"
          />
        )}
        {keyword && !isDebouncing && (
          <button
            aria-label="Xóa từ khóa"
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white"
            type="button"
            onClick={() => {
              setKeyword("");
              setDebouncedKeyword("");
              setIsDebouncing(false);
            }}
          >
            ×
          </button>
        )}
      </label>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
        Điểm đến gợi ý
      </p>
      <div
        aria-busy={loading}
        className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2"
      >
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                className="flex items-center gap-3 rounded-xl p-2"
                key={index}
              >
                <span className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-gray-200 motion-reduce:animate-none" />
                <span className="w-full space-y-2">
                  <span className="block h-3 w-2/3 animate-pulse rounded-full bg-gray-200 motion-reduce:animate-none" />
                  <span className="block h-3 w-1/2 animate-pulse rounded-full bg-gray-100 motion-reduce:animate-none" />
                </span>
              </div>
            ))
          : filteredLocations.map((location) => {
              const imageSource = getImageSource(location.hinhAnh);
              const selected = selectedId === location.id;
              return (
                <button
                  className={`group flex items-center gap-3 rounded-xl p-2 text-left hover:bg-gray-100 ${
                    selected ? "bg-rose-50 ring-1 ring-rose-200" : ""
                  }`}
                  key={location.id}
                  type="button"
                  onClick={() => onSelect(location.id)}
                >
                  <span
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 ${uiClassNames.locationImageSweep}`}
                  >
                    {imageSource ? (
                      <Image
                        fill
                        alt={location.tenViTri}
                        className="object-cover"
                        sizes="56px"
                        src={imageSource}
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-rose-400">
                        ⌖
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {location.tenViTri}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {location.tinhThanh}, {location.quocGia}
                    </span>
                  </span>
                </button>
              );
            })}
      </div>
      {!loading && filteredLocations.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          Không tìm thấy điểm đến phù hợp.
        </p>
      )}
    </div>
  );

  if (variant === "mobile") {
    return (
      <section
        className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
          active ? "border-gray-200 shadow-lg" : "border-gray-200"
        }`}
      >
        <button
          className="flex w-full items-center justify-between px-5 py-5 text-left"
          type="button"
          onClick={onActivate}
        >
          <span className="text-sm font-semibold text-gray-500">Địa điểm</span>
          <span className="max-w-52 truncate text-sm font-semibold text-gray-900">
            {selectedLocation
              ? `${selectedLocation.tenViTri}, ${selectedLocation.tinhThanh}`
              : active
                ? "Bạn muốn đi đâu?"
                : "Thêm điểm đến"}
          </span>
        </button>
        {active && <div className="border-t border-gray-100">{content}</div>}
      </section>
    );
  }

  return (
    <div className="relative min-w-0 flex-[1.35]">
      <button
        className={`search-segment relative z-10 w-full rounded-full px-6 py-3.5 text-left transition-colors duration-200 ${
          active
            ? "bg-rose-50 dark:bg-white/[0.06]"
            : "hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
        }`}
        type="button"
        onClick={onActivate}
      >
        <span className="block text-xs font-semibold text-gray-900">
          Địa điểm
        </span>
        <span className="mt-0.5 block truncate text-sm text-gray-500">
          {selectedLocation
            ? `${selectedLocation.tenViTri}, ${selectedLocation.tinhThanh}`
            : "Tìm kiếm điểm đến"}
        </span>
      </button>
      {active && (
        <div
          className={`${uiClassNames.popoverMotion} absolute top-[calc(100%+14px)] left-0 z-30 w-[min(460px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
