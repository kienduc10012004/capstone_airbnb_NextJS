"use client";

import { useEffect, useRef, useState } from "react";

import SearchPanel from "@/app/components/search/SearchPanel";
import type { DateRange, GuestSelection } from "@/app/components/search/types";
import {
  HEADER_HEIGHT,
  HOME_SEARCH_COMPACT_EVENT,
} from "@/app/lib/home-search";
import { uiClassNames } from "@/app/lib/styles";

type HomeSearchBarProps = {
  embedded?: boolean;
  initialDates?: DateRange;
  initialGuests?: GuestSelection;
  initialLocationId?: number | null;
};

const HomeSearchBar = ({
  embedded = false,
  initialDates,
  initialGuests,
  initialLocationId = null,
}: HomeSearchBarProps) => {
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [compactVisible, setCompactVisible] = useState(false);

  useEffect(() => {
    const searchBar = searchBarRef.current;
    if (!searchBar) {
      return;
    }
    const stickyHeader =
      document.querySelector<HTMLElement>("[data-site-header]");
    const stickyHeaderHeight = stickyHeader?.offsetHeight || HEADER_HEIGHT;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCompactVisible(
          !entry.isIntersecting &&
          entry.boundingClientRect.bottom <= stickyHeaderHeight,
        );
      },
      {
        rootMargin: `-${stickyHeaderHeight}px 0px 0px 0px`,
        threshold: 0,
      },
    );

    observer.observe(searchBar);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<boolean>(HOME_SEARCH_COMPACT_EVENT, {
        detail: compactVisible,
      }),
    );
  }, [compactVisible]);

  useEffect(
    () => () => {
      window.dispatchEvent(
        new CustomEvent<boolean>(HOME_SEARCH_COMPACT_EVENT, {
          detail: false,
        }),
      );
    },
    [],
  );

  const searchPanel = (
    <div className="mx-auto max-w-7xl w-full">
      <SearchPanel
        initialDates={initialDates}
        initialGuests={initialGuests}
        initialLocationId={initialLocationId}
      />
    </div>
  );

  return (
    <div
      className="relative z-30 mt-6"
      data-home-search-bar="true"
      ref={searchBarRef}
    >
      {embedded ? (
        searchPanel
      ) : (
        <div className={uiClassNames.appContainer}>{searchPanel}</div>
      )}
    </div>
  );
};

export default HomeSearchBar;
