"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import DateSelector from "@/app/components/search/DateSelector";
import GuestSelector from "@/app/components/search/GuestSelector";
import LocationSelector from "@/app/components/search/LocationSelector";
import type {
  DateRange,
  GuestSelection,
  SearchSection,
} from "@/app/components/search/types";
import Button from "@/app/components/ui/Button";
import { getLocations, type ApiLocation } from "@/app/lib/api";
import { getStayDateRange } from "@/app/lib/booking-availability";
import { uiClassNames } from "@/app/lib/styles";

type SearchPanelProps = {
  compact?: boolean;
  initialDates?: DateRange;
  initialGuests?: GuestSelection;
  initialLocationId?: number | null;
  mobileOpenOnMount?: boolean;
  onMobileClose?: () => void;
};

const EMPTY_DATES: DateRange = { checkIn: "", checkOut: "" };
const EMPTY_GUESTS: GuestSelection = {
  adults: 0,
  children: 0,
  infants: 0,
  pets: 0,
};

const ACTIVE_INDICATOR_POSITIONS = {
  location: "left-1 w-[calc(40.3%-4px)]",
  dates: "left-[40.3%] w-[29.85%]",
  guests: "left-[70.15%] w-[calc(29.85%-4px)]",
} satisfies Record<Exclude<SearchSection, null>, string>;

const SearchPanel = ({
  compact = false,
  initialDates = EMPTY_DATES,
  initialGuests = EMPTY_GUESTS,
  initialLocationId = null,
  mobileOpenOnMount = false,
  onMobileClose,
}: SearchPanelProps) => {
  const router = useRouter();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SearchSection>(null);
  const [dates, setDates] = useState<DateRange>(initialDates);
  const [guests, setGuests] = useState<GuestSelection>(initialGuests);
  const [locationId, setLocationId] = useState<number | null>(
    initialLocationId,
  );
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(mobileOpenOnMount);
  const [dateError, setDateError] = useState("");

  //==== Đồng bộ bộ lọc: tải vị trí, nhận yêu cầu mở mobile và đóng popover khi click bên ngoài ====
  useEffect(() => {
    let active = true;
    getLocations()
      .then((response) => {
        if (active) setLocations(response.content);
      })
      .catch(() => {
        if (active) setLocations([]);
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const closePopover = (event: MouseEvent) => {
      if (!desktopRef.current?.contains(event.target as Node)) {
        setActiveSection(null);
      }
    };
    document.addEventListener("mousedown", closePopover);
    return () => document.removeEventListener("mousedown", closePopover);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const selectedLocation = locations.find(
    (location) => location.id === locationId,
  );
  const totalGuests = guests.adults + guests.children;
  const activeIndicatorPosition = activeSection
    ? ACTIVE_INDICATOR_POSITIONS[activeSection]
    : ACTIVE_INDICATOR_POSITIONS.location;

  //==== Thực thi tìm kiếm: kiểm tra ngày và chuyển bộ lọc hợp lệ sang trang danh sách phòng ====
  const closeMobileSearch = () => {
    setMobileOpen(false);
    onMobileClose?.();
  };

  const submitSearch = () => {
    const hasSelectedDate = Boolean(dates.checkIn || dates.checkOut);
    const requestedRange = getStayDateRange(dates.checkIn, dates.checkOut);
    if (hasSelectedDate && !requestedRange) {
      setDateError("Vui lòng chọn đủ ngày nhận và ngày trả phòng.");
      setActiveSection("dates");
      return;
    }

    const params = new URLSearchParams();
    if (locationId) params.set("location", String(locationId));
    if (requestedRange) {
      params.set("checkIn", requestedRange.checkIn);
      params.set("checkOut", requestedRange.checkOut);
    }
    if (totalGuests) params.set("guests", String(totalGuests));
    if (guests.adults) params.set("adults", String(guests.adults));
    if (guests.children) params.set("children", String(guests.children));
    if (guests.infants) params.set("infants", String(guests.infants));
    if (guests.pets) params.set("pets", String(guests.pets));
    setActiveSection(null);
    closeMobileSearch();
    router.push(`/rooms${params.size ? `?${params.toString()}` : ""}`);
  };

  const resetSearch = () => {
    setLocationId(null);
    setDates(EMPTY_DATES);
    setGuests(EMPTY_GUESTS);
    setDateError("");
    setActiveSection("location");
  };

  const changeDates = (value: DateRange) => {
    setDates(value);
    setDateError("");
  };

  const selectLocation = (selectedId: number) => {
    setLocationId(selectedId);
    setActiveSection("dates");
  };

  //==== Giao diện tìm kiếm: dùng chung dữ liệu cho thanh desktop và bảng chọn mobile ====
  return (
    <>
      <div
        className={`hidden md:block ${
          compact
            ? "[&_.search-segment]:px-4 [&_.search-segment]:py-2 [&_.search-segment>span:first-child]:text-[11px] [&_.search-segment>span:last-child]:text-xs"
            : ""
        }`}
        ref={desktopRef}
      >
        <div
          className={`relative flex items-center rounded-full border border-gray-200 bg-gray-100 p-1 transition-colors duration-300 hover:bg-gray-300 ${
            compact ? "min-h-14 shadow-lg" : "min-h-17 shadow-xl"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1 bottom-1 z-0 rounded-full bg-white shadow-lg transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${activeIndicatorPosition} ${
              activeSection ? "opacity-100" : "opacity-0"
            }`}
          />
          <LocationSelector
            active={activeSection === "location"}
            loading={locationsLoading}
            locations={locations}
            selectedId={locationId}
            variant="desktop"
            onActivate={() => setActiveSection("location")}
            onSelect={selectLocation}
          />
          <span aria-hidden="true" className="h-8 w-px shrink-0 bg-gray-300" />
          <DateSelector
            active={activeSection === "dates"}
            value={dates}
            variant="desktop"
            onActivate={() => setActiveSection("dates")}
            onChange={changeDates}
            onComplete={() => setActiveSection("guests")}
          />
          <span aria-hidden="true" className="h-8 w-px shrink-0 bg-gray-300" />
          <GuestSelector
            active={activeSection === "guests"}
            value={guests}
            variant="desktop"
            onActivate={() => setActiveSection("guests")}
            onChange={setGuests}
          />
          <button
            aria-label="Tìm kiếm"
            className={`absolute right-2 grid place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md hover:scale-105 hover:from-rose-600 hover:to-pink-700 ${
              compact ? "h-10 w-10 text-lg" : "h-12 w-12 text-xl"
            }`}
            type="button"
            onClick={submitSearch}
          >
            ⌕
          </button>
        </div>
        {dateError && (
          <p
            className="mt-2 text-center text-xs font-medium text-red-500"
            role="alert"
          >
            {dateError}
          </p>
        )}
      </div>

      <button
        className="flex w-full items-center gap-3 rounded-full border border-gray-200 bg-white p-2.5 pr-5 text-left shadow-lg transition-colors duration-300 hover:bg-gray-300 md:hidden"
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setActiveSection(locationId ? "dates" : "location");
        }}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500 text-lg text-white">
          ⌕
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">
            Bạn muốn đi đâu?
          </span>
          <span className="block truncate text-xs text-gray-500">
            {selectedLocation?.tenViTri || "Mọi địa điểm"} ·{" "}
            {dates.checkIn ? "Đã chọn ngày" : "Thêm ngày"} ·{" "}
            {totalGuests ? `${totalGuests} khách` : "Thêm khách"}
          </span>
        </span>
      </button>

      {mobileOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`${uiClassNames.mobileSheetMotion} fixed inset-0 z-[110] bg-gray-100 md:hidden`}
            data-mobile-search-sheet="true"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <button
                  aria-label="Đóng tìm kiếm"
                  className={`${uiClassNames.iconButton} h-9 w-9 text-xl`}
                  type="button"
                  onClick={closeMobileSearch}
                >
                  ×
                </button>
                <h2 className="text-sm font-semibold">Tìm nơi lưu trú</h2>
                <span className="h-9 w-9" />
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3 pb-28">
                <LocationSelector
                  active={activeSection === "location"}
                  loading={locationsLoading}
                  locations={locations}
                  selectedId={locationId}
                  variant="mobile"
                  onActivate={() => setActiveSection("location")}
                  onSelect={selectLocation}
                />
                <DateSelector
                  active={activeSection === "dates"}
                  value={dates}
                  variant="mobile"
                  onActivate={() => setActiveSection("dates")}
                  onChange={changeDates}
                  onComplete={() => setActiveSection("guests")}
                />
                <GuestSelector
                  active={activeSection === "guests"}
                  value={guests}
                  variant="mobile"
                  onActivate={() => setActiveSection("guests")}
                  onChange={setGuests}
                />
                {dateError && (
                  <p
                    className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                    role="alert"
                  >
                    {dateError}
                  </p>
                )}
              </div>
              <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between border-t border-gray-200 bg-white p-4">
                <button
                  className="px-2 py-2 text-sm font-semibold underline"
                  type="button"
                  onClick={resetSearch}
                >
                  Xóa tất cả
                </button>
                <Button className="min-w-32" onClick={submitSearch}>
                  ⌕ Tìm kiếm
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default SearchPanel;
