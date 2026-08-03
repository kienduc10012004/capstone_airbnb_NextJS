"use client";

import { useState } from "react";

type AmenitiesListProps = {
  amenities: string[];
};

const VISIBLE_AMENITIES = 3;

const AmenitiesList = ({ amenities }: AmenitiesListProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = amenities.length > VISIBLE_AMENITIES;
  const displayedAmenities = expanded
    ? amenities
    : amenities.slice(0, VISIBLE_AMENITIES);

  return (
    <div data-amenities-list="true">
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {displayedAmenities.map((amenity) => (
          <div
            className="flex items-center gap-3 rounded-xl px-1 py-2 text-sm text-gray-700"
            data-amenity="true"
            key={amenity}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 font-semibold text-rose-500">
              ✓
            </span>
            {amenity}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className="mt-5 rounded-xl border border-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
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
