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
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Link className="hover:text-rose-500" href="/rooms">
            Phòng ở
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-gray-700">{locationLabel}</span>
        </nav>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">
              {room.tenPhong}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <a
                className="font-semibold text-gray-900 underline-offset-4 hover:underline"
                href="#reviews"
              >
                {rating
                  ? `★ ${rating.toFixed(1)} · ${comments.length} đánh giá`
                  : "Chưa có đánh giá"}
              </a>
              <span className="text-gray-300">·</span>
              <span className="text-gray-600">{locationLabel}</span>
            </div>
          </div>
          <RoomShareButton roomName={room.tenPhong} />
        </div>

        <RoomGallery imageSource={imageSource} roomName={room.tenPhong} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="min-w-0">
            <section className="border-b border-gray-200 pb-8">
              <p className="text-sm font-semibold text-rose-500">
                Thông tin lưu trú
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-gray-950">
                Không gian phù hợp cho tối đa {room.khach} khách
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Khách", room.khach],
                  ["Phòng ngủ", room.phongNgu],
                  ["Giường", room.giuong],
                  ["Phòng tắm", room.phongTam],
                ].map(([label, value]) => (
                  <div
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    key={label}
                  >
                    <p className="text-2xl font-semibold text-gray-950">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-gray-200 py-8">
              <h2 className="text-2xl font-semibold text-gray-950">
                Về không gian này
              </h2>
              <ExpandableText
                className="mt-4 text-sm leading-7 text-gray-600 sm:text-base"
                previewLength={220}
                text={room.moTa || "Chủ nhà chưa cập nhật mô tả cho phòng này."}
              />
            </section>

            <section className="border-b border-gray-200 py-8">
              <div>
                <p className="text-sm font-semibold text-rose-500">
                  Những gì nơi này cung cấp
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-gray-950">
                  Tiện nghi nổi bật
                </h2>
              </div>
              {availableAmenities.length ? (
                <AmenitiesList amenities={amenityLabels} />
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Tiện nghi đang được cập nhật.
                </p>
              )}
            </section>

            <section className="py-8">
              <p className="text-sm font-semibold text-rose-500">
                Khu vực lưu trú
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-gray-950">
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

        <div id="reviews">
          <CommentsSection initialComments={comments} roomId={room.id} />
        </div>

        <section className="border-t border-gray-200 py-10 sm:py-14">
          <p className="text-sm font-semibold text-rose-500">
            Vị trí trên bản đồ
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-950">
            Nơi bạn sẽ đến
          </h2>
          <p className="mt-2 text-sm text-gray-500">{locationLabel}</p>
          <RoomMap location={location} />
        </section>

        {relatedRooms.length > 0 && (
          <section className="border-t border-gray-200 py-10 sm:py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-rose-500">
                  Gợi ý cùng khu vực
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-gray-950">
                  Những phòng khác tại {location?.tenViTri || "vị trí này"}
                </h2>
              </div>
              {location && (
                <Link
                  className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600"
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
