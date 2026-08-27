import type { Metadata } from "next";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import LocationCard from "@/app/components/locations/LocationCard";
import LocationSearchBar from "@/app/components/locations/LocationSearchBar";
import { normalizeVietnameseSearch } from "@/app/components/search/date-utils";
import EmptyState from "@/app/components/ui/EmptyState";
import Pagination from "@/app/components/ui/Pagination";
import { getLocations, getLocationsPaged, type ApiLocation } from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Điểm đến",
  description: "Khám phá các điểm đến nổi bật cho chuyến đi tiếp theo.",
};

type LocationsPageProps = {
  searchParams: Promise<{ keyword?: string; page?: string }>;
};

const PAGE_SIZE = 8;

export default async function LocationsPage({
  searchParams,
}: LocationsPageProps) {
  const query = await searchParams;
  const currentPage = Math.max(Number(query.page) || 1, 1);
  const keyword = query.keyword?.trim() ?? "";

  let locations: ApiLocation[] = [];
  let totalRow = 0;

  try {
    const response = await getLocationsPaged({
      keyword: keyword || undefined,
      pageIndex: currentPage,
      pageSize: PAGE_SIZE,
    });

    locations = response.content.data;
    totalRow = response.content.totalRow;

    // Fallback: Khi tìm kiếm có từ khóa nhưng API không khớp (do từ khóa gõ không dấu, vd: "hon rua")
    if (locations.length === 0 && keyword) {
      const allResponse = await getLocations();
      const normKey = normalizeVietnameseSearch(keyword);
      const filtered = (allResponse.content || []).filter((loc) => {
        const ten = normalizeVietnameseSearch(loc.tenViTri);
        const tinh = normalizeVietnameseSearch(loc.tinhThanh);
        const quoc = normalizeVietnameseSearch(loc.quocGia);
        return (
          ten.includes(normKey) ||
          tinh.includes(normKey) ||
          quoc.includes(normKey)
        );
      });

      totalRow = filtered.length;
      const start = (currentPage - 1) * PAGE_SIZE;
      locations = filtered.slice(start, start + PAGE_SIZE);
    }
  } catch {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className={`${uiClassNames.appContainer} flex-1 py-16`}>
          <EmptyState
            description="Không thể tải dữ liệu điểm đến. Vui lòng thử lại sau."
            icon="!"
            title="Có lỗi xảy ra"
          />
        </main>
        <Footer />
      </div>
    );
  }

  const totalPages = Math.max(Math.ceil(totalRow / PAGE_SIZE), 1);
  const pageHref = (page: number) => {
    const params = new URLSearchParams({ page: String(page) });
    if (keyword) params.set("keyword", keyword);
    return `/locations?${params.toString()}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${uiClassNames.appContainer} flex-1 py-8 sm:py-12`}>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-rose-500">
              Đi khắp Việt Nam
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Điểm đến truyền cảm hứng
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-slate-400">
              Khám phá những khu vực nổi bật và tìm căn phòng phù hợp chỉ trong
              vài bước.
            </p>
          </div>
          <LocationSearchBar initialKeyword={keyword} />
        </div>

        {locations.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {locations.map((location, index) => (
              <LocationCard
                key={location.id}
                location={location}
                priority={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              description="Không có vị trí phù hợp với từ khóa hiện tại."
              title="Chưa tìm thấy điểm đến"
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
