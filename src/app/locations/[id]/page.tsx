import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import RoomCard from "@/app/components/RoomCard";
import HomeSearchBar from "@/app/components/search/HomeSearchBar";
import { buttonClassName } from "@/app/components/ui/Button";
import EmptyState from "@/app/components/ui/EmptyState";
import Pagination from "@/app/components/ui/Pagination";
import {
  getLocationById,
  getRoomsByLocation,
  type ApiLocation,
  type ApiRoom,
  isApiNotFoundError,
} from "@/app/lib/api";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";

export const dynamic = "force-dynamic";

type LocationDetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 8;

export async function generateMetadata({
  params,
}: LocationDetailProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const location = await getLocationById(Number(id));
    return {
      title: location.tenViTri,
      description: `Khám phá phòng thuê tại ${location.tenViTri}, ${location.tinhThanh}.`,
    };
  } catch {
    return { title: "Điểm đến" };
  }
}

//==== Chi tiết địa điểm: tải phòng theo vị trí và phân trang kết quả tại server ====
export default async function LocationDetailPage({
  params,
  searchParams,
}: LocationDetailProps) {
  const { id } = await params;
  const query = await searchParams;
  const locationId = Number(id);
  if (!Number.isInteger(locationId) || locationId <= 0) {
    notFound();
  }

  let location: ApiLocation;
  try {
    location = await getLocationById(locationId);
  } catch (error) {
    if (isApiNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  let rooms: ApiRoom[] = [];
  let roomsLoadFailed = false;
  try {
    const roomsResponse = await getRoomsByLocation(locationId);
    rooms = roomsResponse.content;
  } catch {
    roomsLoadFailed = true;
  }
  const imageSource = getImageSource(location.hinhAnh);
  const totalPages = Math.max(Math.ceil(rooms.length / PAGE_SIZE), 1);
  const requestedPage = Math.max(Number(query.page) || 1, 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const pageHref = (page: number) => `/locations/${location.id}?page=${page}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className={`${uiClassNames.appContainer} pt-6 sm:pt-10`}>
          <div
            className={`group relative min-h-80 overflow-hidden rounded-3xl bg-gray-900 sm:min-h-105 ${uiClassNames.locationImageSweep}`}
          >
            {imageSource && (
              <Image
                fill
                priority
                alt={location.tenViTri}
                className="object-cover opacity-75"
                sizes="100vw"
                src={imageSource}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-6 text-white sm:p-10">
              <p className="text-sm font-semibold text-rose-200">
                {location.quocGia}
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
                {location.tenViTri}
              </h1>
              <p className="mt-2 text-white/80">{location.tinhThanh}</p>
            </div>
          </div>
        </section>

        <HomeSearchBar initialLocationId={location.id} />

        <section className={`${uiClassNames.appContainer} py-12`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Phòng tại {location.tenViTri}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {rooms.length} lựa chọn dành cho hành trình của bạn.
              </p>
            </div>
          </div>

          {roomsLoadFailed ? (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
              Chưa thể tải danh sách phòng tại vị trí này. Vui lòng thử lại sau.
            </p>
          ) : paginatedRooms.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedRooms.map((room) => (
                <RoomCard key={room.id} location={location} room={room} />
              ))}
            </div>
          ) : (
            <div className="mt-7">
              <EmptyState
                action={
                  <Link className={buttonClassName()} href="/locations">
                    Khám phá địa điểm khác
                  </Link>
                }
                description="Địa điểm này hiện chưa có phòng thuê trong dữ liệu."
                title="Chưa có phòng tại địa điểm này"
              />
            </div>
          )}

          {!roomsLoadFailed && (
            <Pagination
              ariaLabel="Phân trang phòng"
              currentPage={currentPage}
              getHref={pageHref}
              totalPages={totalPages}
            />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
