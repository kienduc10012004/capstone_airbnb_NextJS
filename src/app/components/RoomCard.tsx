import Image from "next/image";
import Link from "next/link";

import FavoriteButton from "@/app/components/favorites/FavoriteButton";
import type { ApiLocation, ApiRoom } from "@/app/lib/api";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";

type RoomCardProps = {
  location?: ApiLocation;
  query?: string;
  rating?: number | null;
  room: ApiRoom;
};

const RoomCard = ({ location, query, rating = null, room }: RoomCardProps) => {
  const imageSource = getImageSource(room.hinhAnh);
  const roomHref = `/rooms/${room.id}${query ? `?${query}` : ""}`;
  return (
    <article className="group relative">
      <FavoriteButton roomId={room.id} />
      <Link className="block" href={roomHref}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
          {imageSource ? (
            <Image
              fill
              alt={room.tenPhong}
              className={`${uiClassNames.cardImageZoom} group-hover:scale-105`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={imageSource}
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-rose-50 to-gray-100 text-3xl text-rose-300">
              ⌂
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300 ease-out group-hover:text-rose-600 dark:group-hover:text-rose-400">
              {room.tenPhong}
            </h3>
            {rating && (
              <span className="shrink-0 text-sm text-gray-700 dark:text-gray-300">
                ★ {rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-gray-500 dark:text-slate-400">
            {location
              ? `${location.tenViTri}, ${location.tinhThanh}`
              : "Vị trí đang cập nhật"}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {room.khach} khách · {room.phongNgu} phòng ngủ · {room.giuong}{" "}
            giường
          </p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              ${room.giaTien}
            </span>{" "}
            / đêm
          </p>
        </div>
      </Link>
    </article>
  );
};

export default RoomCard;
