"use client";

import { useState } from "react";

type AmenitiesListProps = {
  amenities: string[];
};

const VISIBLE_AMENITIES = 4;

const AmenitiesList = ({ amenities }: AmenitiesListProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = amenities.length > VISIBLE_AMENITIES;
  const displayedAmenities = expanded
    ? amenities
    : amenities.slice(0, VISIBLE_AMENITIES);

  return (
    <div data-amenities-list="true">
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {displayedAmenities.map((amenity) => (
          <div
            className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-slate-800/40 px-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-slate-200 transition-colors"
            data-amenity="true"
            key={amenity}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-50 dark:bg-rose-950/50 font-bold text-rose-500 dark:text-rose-400">
              <i className="fa-solid fa-check text-xs" />
            </span>
            <span>{amenity}</span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className="mt-4 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Thu gọn" : `Xem tất cả ${amenities.length} tiện nghi`}
        </button>
      )}
    </div>
  );
};

export default AmenitiesList;
