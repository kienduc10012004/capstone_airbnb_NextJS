import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BookingCard from "@/app/components/bookings/BookingCard";
import CommentsSection from "@/app/components/comments/CommentsSection";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import RoomCard from "@/app/components/RoomCard";
import AmenitiesList from "@/app/components/rooms/AmenitiesList";
import RoomGallery from "@/app/components/rooms/RoomGallery";
import RoomLocationCard from "@/app/components/rooms/RoomLocationCard";
import RoomMap from "@/app/components/rooms/RoomMap";
import RoomsSlider from "@/app/components/rooms/RoomsSlider";
import RoomShareButton from "@/app/components/rooms/RoomShareButton";
import ExpandableText from "@/app/components/ui/ExpandableText";
import {
  getCommentsByRoom,
  getLocationById,
  getRoomById,
  getRoomsByLocation,
  isApiNotFoundError,
} from "@/app/lib/api";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";

export const dynamic = "force-dynamic";

type RoomDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>;
};

const amenities = [
  ["wifi", "Wi-Fi tốc độ cao"],
  ["dieuHoa", "Điều hòa"],
  ["bep", "Bếp"],
  ["mayGiat", "Máy giặt"],
  ["tivi", "TV"],
  ["doXe", "Chỗ đỗ xe"],
  ["hoBoi", "Hồ bơi"],
  ["banLa", "Bàn là"],
  ["banUi", "Bàn ủi"],
] as const;

export async function generateMetadata({
  params,
}: RoomDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const room = await getRoomById(Number(id));
    return { title: room.tenPhong, description: room.moTa };
  } catch {
    return { title: "Chi tiết phòng" };
  }
}

//==== Chi tiết phòng: tổng hợp vị trí, đánh giá, tiện nghi và phòng cùng khu vực ====
export default async function RoomDetailPage({
  params,
  searchParams,
}: RoomDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const roomId = Number(id);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    notFound();
  }

  let room: Awaited<ReturnType<typeof getRoomById>>;
  try {
    room = await getRoomById(roomId);
  } catch (error) {
    if (isApiNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  const [location, commentsResponse, relatedRoomsResponse] = await Promise.all([
    getLocationById(room.maViTri).catch(() => null),
    getCommentsByRoom(room.id).catch(() => null),
    getRoomsByLocation(room.maViTri).catch(() => null),
  ]);

  const comments = commentsResponse?.content ?? [];
  const rating = comments.length
    ? comments.reduce((total, comment) => total + comment.saoBinhLuan, 0) /
      comments.length
    : null;
  const locationRooms = relatedRoomsResponse?.content ?? [];
  const relatedRooms = locationRooms.filter(
    (relatedRoom) => relatedRoom.id !== room.id,
  );
  const shouldUseRelatedSlider = relatedRooms.length >= 6;
  const displayedRelatedRooms = shouldUseRelatedSlider
    ? relatedRooms.slice(0, 6)
    : relatedRooms;
  const availableAmenities = amenities.filter(([key]) => room[key]);
  const amenityLabels = availableAmenities.map(([, label]) => label);
  const imageSource = getImageSource(room.hinhAnh);
  const locationImageSource = getImageSource(location?.hinhAnh);
  const locationLabel = location
    ? `${location.tenViTri}, ${location.tinhThanh}, ${location.quocGia}`
    : "Vị trí đang cập nhật";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={`${uiClassNames.appContainer} flex-1 pt-6 pb-28 sm:pt-8 lg:pb-14`}
      >
        <nav
          aria-label="Điều hướng trang"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400"
        >
          <Link className="hover:text-rose-500 transition-colors" href="/rooms">
            Phòng ở
          </Link>
          <span aria-hidden="true" className="text-gray-300 dark:text-slate-600">/</span>
          <span className="truncate text-gray-700 dark:text-slate-300">{locationLabel}</span>
        </nav>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl lg:text-4xl">
              {room.tenPhong}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <a
                className="font-semibold text-gray-900 dark:text-slate-200 underline-offset-4 hover:underline hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                href="#reviews"
              >
                {rating
                  ? `★ ${rating.toFixed(1)} · ${comments.length} đánh giá`
                  : "Chưa có đánh giá"}
              </a>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <span className="text-gray-600 dark:text-slate-400">{locationLabel}</span>
            </div>
          </div>
          <RoomShareButton roomName={room.tenPhong} />
        </div>

        <RoomGallery imageSource={imageSource} roomName={room.tenPhong} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
          <div className="min-w-0 space-y-6">
            {/* Khung 1: Thông tin lưu trú */}
            <section className="rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                <i className="fa-solid fa-house-chimney text-xs" />
                <span>Thông tin lưu trú</span>
              </div>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-950 dark:text-white">
                Không gian phù hợp cho tối đa {room.khach} khách
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Khách", room.khach, "fa-solid fa-users"],
                  ["Phòng ngủ", room.phongNgu, "fa-solid fa-door-open"],
                  ["Giường", room.giuong, "fa-solid fa-bed"],
                  ["Phòng tắm", room.phongTam, "fa-solid fa-bath"],
                ].map(([label, value, icon]) => (
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-slate-800/60 p-4 text-center transition-all hover:bg-gray-100/80 dark:hover:bg-slate-800"
                    key={label as string}
                  >
                    <i className={`${icon} text-lg text-rose-500 mb-2`} />
                    <p className="text-2xl font-bold text-gray-950 dark:text-white">
                      {value as number}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 font-medium">{label as string}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Khung 2: Về không gian này */}
            <section className="rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                <i className="fa-solid fa-align-left text-xs" />
                <span>Tổng quan</span>
              </div>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-950 dark:text-white">
                Về không gian này
              </h2>
              <div className="mt-4 rounded-2xl bg-gray-50/80 dark:bg-slate-800/40 p-4 sm:p-5 border border-gray-100 dark:border-white/5">
                <ExpandableText
                  className="text-sm leading-relaxed text-gray-700 dark:text-slate-200 sm:text-base"
                  previewLength={200}
                  text={room.moTa || "Chủ nhà chưa cập nhật mô tả cho phòng này."}
                />
              </div>
            </section>

            {/* Khung 3: Tiện nghi nổi bật */}
            <section className="rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-7 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                  <i className="fa-solid fa-sparkles text-xs" />
                  <span>Những gì nơi này cung cấp</span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-950 dark:text-white">
                  Tiện nghi nổi bật
                </h2>
              </div>
              {availableAmenities.length ? (
                <AmenitiesList amenities={amenityLabels} />
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
                  Tiện nghi đang được cập nhật.
                </p>
              )}
            </section>

            {/* Khung 4: Khu vực lưu trú & Khám phá */}
            <section className="rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                <i className="fa-solid fa-map-location-dot text-xs" />
                <span>Khu vực lưu trú</span>
              </div>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-950 dark:text-white">
                Khám phá {location?.tenViTri || "vị trí phòng"}
              </h2>
              <RoomLocationCard
                imageSource={locationImageSource}
                location={location}
                roomLocationId={room.maViTri}
              />
            </section>
          </div>

          <BookingCard
            initialCheckIn={query.checkIn}
            initialCheckOut={query.checkOut}
            initialGuests={Number(query.guests) || 1}
            maxGuests={room.khach}
            price={room.giaTien}
            rating={rating}
            reviewCount={comments.length}
            roomId={room.id}
          />
        </div>

        {/* Khung Đánh giá */}
        <div id="reviews" className="mt-10 rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-8 shadow-xs">
          <CommentsSection initialComments={comments} roomId={room.id} />
        </div>

        {/* Khung Bản đồ */}
        <section className="mt-10 rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
            <i className="fa-solid fa-map-pin text-xs" />
            <span>Vị trí trên bản đồ</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">
            Nơi bạn sẽ đến
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{locationLabel}</p>
          <div className="mt-5 overflow-hidden rounded-2xl">
            <RoomMap location={location} />
          </div>
        </section>

        {/* Khung Gợi ý cùng khu vực */}
        {relatedRooms.length > 0 && (
          <section className="mt-10 rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                  <i className="fa-solid fa-compass text-xs" />
                  <span>Gợi ý cùng khu vực</span>
                </div>
                <h2 className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">
                  Những phòng khác tại {location?.tenViTri || "vị trí này"}
                </h2>
              </div>
              {location && (
                <Link
                  className="rounded-full border border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-gray-900 dark:text-white hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-all shadow-xs"
                  href={`/locations/${location.id}`}
                >
                  Xem tất cả
                </Link>
              )}
            </div>
            {shouldUseRelatedSlider ? (
              <RoomsSlider
                ariaLabel="Các phòng khác cùng khu vực"
                id="related-rooms-slider"
                location={location ?? undefined}
                rooms={displayedRelatedRooms}
              />
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                {displayedRelatedRooms.map((relatedRoom) => (
                  <RoomCard
                    key={relatedRoom.id}
                    location={location ?? undefined}
                    room={relatedRoom}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
