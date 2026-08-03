import Link from "next/link";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import HomeBannerSlider from "@/app/components/home/HomeBannerSlider";
import FeaturedLocations from "@/app/components/locations/FeaturedLocations";
import RoomCard from "@/app/components/RoomCard";
import RoomsSlider from "@/app/components/rooms/RoomsSlider";
import HomeSearchBar from "@/app/components/search/HomeSearchBar";
import { buttonClassName } from "@/app/components/ui/Button";
import {
  getAllRooms,
  getComments,
  getLocations,
  getRooms,
  type ApiComment,
  type ApiRoom,
} from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";

export const dynamic = "force-dynamic";

//==== Xếp hạng phòng nổi bật: tính sao trung bình và ưu tiên số lượng đánh giá ====
const getTopRatedRooms = (rooms: ApiRoom[], comments: ApiComment[]) => {
  const ratingStats = new Map<number, { count: number; totalStars: number }>();

  comments.forEach((comment) => {
    const current = ratingStats.get(comment.maPhong) ?? {
      count: 0,
      totalStars: 0,
    };
    ratingStats.set(comment.maPhong, {
      count: current.count + 1,
      totalStars: current.totalStars + comment.saoBinhLuan,
    });
  });

  const topRatedRooms = rooms
    .filter((room) => ratingStats.has(room.id))
    .sort((firstRoom, secondRoom) => {
      const firstStats = ratingStats.get(firstRoom.id);
      const secondStats = ratingStats.get(secondRoom.id);
      const firstAverage = firstStats
        ? firstStats.totalStars / firstStats.count
        : 0;
      const secondAverage = secondStats
        ? secondStats.totalStars / secondStats.count
        : 0;

      return (
        secondAverage - firstAverage ||
        (secondStats?.count ?? 0) - (firstStats?.count ?? 0) ||
        (secondStats?.totalStars ?? 0) - (firstStats?.totalStars ?? 0) ||
        firstRoom.id - secondRoom.id
      );
    })
    .slice(0, 6);
  const ratings = Object.fromEntries(
    topRatedRooms.flatMap((room) => {
      const stats = ratingStats.get(room.id);
      return stats ? [[room.id, stats.totalStars / stats.count]] : [];
    }),
  );

  return { ratings, rooms: topRatedRooms };
};

//==== Tải dữ liệu trang chủ: gom phòng, vị trí và đánh giá trong một lần chờ ====
const getHomeData = async () => {
  try {
    const [
      roomsResponse,
      allRoomsResponse,
      commentsResponse,
      locationsResponse,
    ] = await Promise.all([
      getRooms(1, 8),
      getAllRooms(),
      getComments().catch(() => null),
      getLocations(),
    ]);
    const topRated = commentsResponse
      ? getTopRatedRooms(allRoomsResponse.content, commentsResponse.content)
      : { ratings: {}, rooms: [] };
    return {
      locations: locationsResponse.content,
      rooms: roomsResponse.content.data,
      topRatedRooms: topRated.rooms,
      topRoomRatings: topRated.ratings,
    };
  } catch {
    return {
      locations: [],
      rooms: [],
      topRatedRooms: [],
      topRoomRatings: {},
    };
  }
};

//==== Trang chủ: kết hợp banner, tìm kiếm, địa điểm và các nhóm phòng nổi bật ====
export default async function Home() {
  const { locations, rooms, topRatedRooms, topRoomRatings } =
    await getHomeData();
  const locationMap = new Map(
    locations.map((location) => [location.id, location]),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main>
        <section className={`${uiClassNames.appContainer} pt-6 sm:pt-10`}>
          <HomeBannerSlider />
        </section>

        <HomeSearchBar />

        <section className={`${uiClassNames.appContainer} py-12 sm:py-16`}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-rose-500">Khám phá</p>
              <h2 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
                Điểm đến được yêu thích
              </h2>
            </div>
            <Link
              className="hidden text-sm font-semibold text-gray-700 hover:text-rose-500 sm:block"
              href="/locations"
            >
              Xem tất cả
              <i
                aria-hidden="true"
                className="fa-solid fa-chevron-right ml-1"
              />
            </Link>
          </div>
          {locations.length > 0 ? (
            <FeaturedLocations locations={locations} />
          ) : (
            <p className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
              Chưa thể tải danh sách điểm đến.
            </p>
          )}
        </section>

        {topRatedRooms.length > 0 && (
          <section className="border-t border-gray-100 bg-white py-12 sm:py-16">
            <div className={uiClassNames.appContainer}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-500">
                    Được khách hàng đánh giá cao
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
                    Phòng nổi bật
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Top 6 phòng có điểm đánh giá trung bình cao nhất.
                  </p>
                </div>
                <Link className={buttonClassName("secondary")} href="/rooms">
                  Xem tất cả phòng
                </Link>
              </div>
              <RoomsSlider
                ariaLabel="Top sáu phòng nổi bật"
                id="featured-rooms-slider"
                locations={locations}
                ratings={topRoomRatings}
                rooms={topRatedRooms}
              />
            </div>
          </section>
        )}

        <section className="border-y border-gray-100 bg-gray-50/80 py-12">
          <div className={uiClassNames.appContainer}>
            <div className="mb-6">
              <div>
                <p className="text-sm font-semibold text-rose-500">
                  Lựa chọn nổi bật
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Không gian dành cho bạn
                </h2>
              </div>
            </div>
            {rooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    location={locationMap.get(room.maViTri)}
                    room={room}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">
                Chưa thể tải danh sách phòng.
              </p>
            )}
            <div className="mt-10 text-center">
              <Link className={buttonClassName("secondary")} href="/rooms">
                Xem toàn bộ phòng
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
