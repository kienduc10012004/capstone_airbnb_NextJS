import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import RoomCard from "@/app/components/RoomCard";
import HomeSearchBar from "@/app/components/search/HomeSearchBar";
import { formatShortDate } from "@/app/components/search/date-utils";
import { buttonClassName } from "@/app/components/ui/Button";
import EmptyState from "@/app/components/ui/EmptyState";
import Pagination from "@/app/components/ui/Pagination";
import {
  getAllRooms,
  getBookings,
  getLocations,
  getRooms,
  getRoomsByLocation,
  type ApiLocation,
  type ApiRoom,
} from "@/app/lib/api";
import {
  filterAvailableRooms,
  getStayDateRange,
  type StayDateRange,
} from "@/app/lib/booking-availability";
import { uiClassNames } from "@/app/lib/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Danh sách phòng",
  description: "Tìm kiếm không gian lưu trú phù hợp cho chuyến đi của bạn.",
};

type RoomsPageProps = {
  searchParams: Promise<{
    keyword?: string;
    location?: string;
    page?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    adults?: string;
    children?: string;
    infants?: string;
    pets?: string;
  }>;
};

type RoomsPageData = {
  locations: ApiLocation[];
  rooms: ApiRoom[];
  totalRows: number;
};

const PAGE_SIZE = 12;

//==== Tải danh sách phòng: kết hợp phân trang API với bộ lọc ngày và sức chứa ====
const loadPageData = async ({
  currentPage,
  keyword,
  locationId,
  guestCount,
  requestedRange,
}: {
  currentPage: number;
  keyword: string;
  locationId: number;
  guestCount: number;
  requestedRange: StayDateRange | null;
}): Promise<RoomsPageData | null> => {
  try {
    const locationsResponse = await getLocations();
    const needsLocalFiltering = Boolean(
      locationId || guestCount || requestedRange,
    );

    if (needsLocalFiltering) {
      const roomsResponse = locationId
        ? await getRoomsByLocation(locationId)
        : await getAllRooms();
      const matchingRooms = roomsResponse.content.filter(
        (room) =>
          (!keyword ||
            room.tenPhong.toLowerCase().includes(keyword.toLowerCase())) &&
          (!guestCount || room.khach >= guestCount),
      );
      const filteredRooms = requestedRange
        ? filterAvailableRooms(
            matchingRooms,
            (await getBookings()).content,
            requestedRange,
          )
        : matchingRooms;

      return {
        locations: locationsResponse.content,
        rooms: filteredRooms.slice(
          (currentPage - 1) * PAGE_SIZE,
          currentPage * PAGE_SIZE,
        ),
        totalRows: filteredRooms.length,
      };
    }

    const roomsResponse = await getRooms(currentPage, PAGE_SIZE, keyword);
    return {
      locations: locationsResponse.content,
      rooms: roomsResponse.content.data,
      totalRows: roomsResponse.content.totalRow,
    };
  } catch {
    return null;
  }
};

//==== Trang phòng ở: chuẩn hóa query, dựng bộ lọc và hiển thị kết quả phân trang ====
export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const query = await searchParams;
  const currentPage = Math.max(Number(query.page) || 1, 1);
  const keyword = query.keyword?.trim() ?? "";
  const locationId = Number(query.location) || 0;
  const guestCount = Number(query.guests) || 0;
  const checkIn = query.checkIn ?? "";
  const checkOut = query.checkOut ?? "";
  const requestedRange = getStayDateRange(checkIn, checkOut);
  const guests = {
    adults: Number(query.adults) || 0,
    children: Number(query.children) || 0,
    infants: Number(query.infants) || 0,
    pets: Number(query.pets) || 0,
  };
  const pageData = await loadPageData({
    currentPage,
    guestCount,
    keyword,
    locationId,
    requestedRange,
  });

  if (!pageData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className={`${uiClassNames.appContainer} flex-1 py-16`}>
          <EmptyState
            description="Không thể tải danh sách phòng. Vui lòng thử lại sau."
            icon="!"
            title="Có lỗi xảy ra"
          />
        </main>
        <Footer />
      </div>
    );
  }

  const { locations, rooms, totalRows } = pageData;
  const locationMap = new Map(
    locations.map((location) => [location.id, location]),
  );
  const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (locationId) params.set("location", String(locationId));
    if (requestedRange) {
      params.set("checkIn", requestedRange.checkIn);
      params.set("checkOut", requestedRange.checkOut);
    }
    if (guestCount) params.set("guests", String(guestCount));
    if (guests.adults) params.set("adults", String(guests.adults));
    if (guests.children) params.set("children", String(guests.children));
    if (guests.infants) params.set("infants", String(guests.infants));
    if (guests.pets) params.set("pets", String(guests.pets));
    params.set("page", String(page));
    return `/rooms?${params.toString()}`;
  };
  const detailParams = new URLSearchParams();
  if (requestedRange) {
    detailParams.set("checkIn", requestedRange.checkIn);
    detailParams.set("checkOut", requestedRange.checkOut);
  }
  if (guestCount) detailParams.set("guests", String(guestCount));
  const selectedLocation = locationMap.get(locationId);
  const hasGuestSelection = Boolean(
    guestCount || guests.infants || guests.pets,
  );

  type FilterGroup = "dates" | "guests" | "keyword" | "location";

  const filterHref = (excludedGroup: FilterGroup) => {
    const params = new URLSearchParams();
    if (keyword && excludedGroup !== "keyword") {
      params.set("keyword", keyword);
    }
    if (locationId && excludedGroup !== "location") {
      params.set("location", String(locationId));
    }
    if (requestedRange && excludedGroup !== "dates") {
      params.set("checkIn", requestedRange.checkIn);
      params.set("checkOut", requestedRange.checkOut);
    }
    if (excludedGroup !== "guests") {
      if (guestCount) params.set("guests", String(guestCount));
      if (guests.adults) params.set("adults", String(guests.adults));
      if (guests.children) params.set("children", String(guests.children));
      if (guests.infants) params.set("infants", String(guests.infants));
      if (guests.pets) params.set("pets", String(guests.pets));
    }
    return `/rooms${params.size ? `?${params.toString()}` : ""}`;
  };

  const activeFilters: { group: FilterGroup; label: string }[] = [];
  if (keyword) {
    activeFilters.push({ group: "keyword", label: `“${keyword}”` });
  }
  if (selectedLocation) {
    activeFilters.push({
      group: "location",
      label: selectedLocation.tenViTri,
    });
  }
  if (requestedRange) {
    activeFilters.push({
      group: "dates",
      label: `${formatShortDate(requestedRange.checkIn)} – ${formatShortDate(
        requestedRange.checkOut,
      )}`,
    });
  }
  if (hasGuestSelection) {
    const guestDetails = [
      guestCount ? `${guestCount} khách` : "",
      guests.infants ? `${guests.infants} em bé` : "",
      guests.pets ? `${guests.pets} thú cưng` : "",
    ].filter(Boolean);
    activeFilters.push({
      group: "guests",
      label: guestDetails.join(" · "),
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${uiClassNames.appContainer} flex-1 py-8 sm:py-12`}>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-rose-500">Tìm nơi ở</p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900 sm:text-4xl">
            Không gian phù hợp với hành trình
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Lọc theo điểm đến hoặc tên phòng để tìm lựa chọn phù hợp nhất.
          </p>
        </div>

        <HomeSearchBar
          embedded
          initialDates={
            requestedRange ?? {
              checkIn: "",
              checkOut: "",
            }
          }
          initialGuests={guests}
          initialLocationId={locationId || null}
        />

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {totalRows}{" "}
              {requestedRange
                ? "phòng còn trống được tìm thấy"
                : "phòng được tìm thấy"}
            </h2>
            {(requestedRange || hasGuestSelection) && (
              <p className="mt-1 text-sm text-gray-500">
                {requestedRange
                  ? `${formatShortDate(
                      requestedRange.checkIn,
                    )} – ${formatShortDate(requestedRange.checkOut)}`
                  : "Thời gian linh hoạt"}
                {guestCount ? ` · ${guestCount} khách` : ""}
              </p>
            )}
          </div>
          {activeFilters.length > 0 && (
            <Link
              className="text-sm text-rose-600 hover:underline"
              href="/rooms"
            >
              Xóa bộ lọc
            </Link>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div
            aria-label="Bộ lọc đang áp dụng"
            className="mt-4 flex flex-wrap gap-2"
          >
            {activeFilters.map((filter) => (
              <Link
                aria-label={`Xóa bộ lọc ${filter.label}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                href={filterHref(filter.group)}
                key={filter.group}
              >
                {filter.label}
                <span aria-hidden="true" className="text-base leading-none">
                  ×
                </span>
              </Link>
            ))}
          </div>
        )}

        {rooms.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                location={locationMap.get(room.maViTri)}
                query={detailParams.toString()}
                room={room}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  {requestedRange && (
                    <Link
                      className={buttonClassName("secondary")}
                      href={filterHref("dates")}
                    >
                      Xem ngày khác
                    </Link>
                  )}
                  {hasGuestSelection && (
                    <Link
                      className={buttonClassName("secondary")}
                      href={filterHref("guests")}
                    >
                      Giảm số khách
                    </Link>
                  )}
                  <Link className={buttonClassName()} href="/rooms">
                    Xem tất cả phòng
                  </Link>
                </div>
              }
              description={
                requestedRange
                  ? "Không còn phòng phù hợp trong khoảng ngày đã chọn. Hãy thử đổi ngày, giảm số khách hoặc xem tất cả phòng."
                  : "Hãy thử một từ khóa, số khách hoặc địa điểm khác."
              }
              title="Không tìm thấy phòng phù hợp"
            />
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          getHref={pageHref}
          totalPages={totalPages}
        />
      </main>
      <Footer />
    </div>
  );
}
