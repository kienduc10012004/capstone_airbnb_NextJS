import Image from "next/image";
import Link from "next/link";

import type { ApiLocation } from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";

type RoomLocationCardProps = {
  imageSource: string | null;
  location: ApiLocation | null;
  roomLocationId: number;
};

const RoomLocationCard = ({
  imageSource,
  location,
  roomLocationId,
}: RoomLocationCardProps) => {
  const locationName = location?.tenViTri || "Vị trí đang cập nhật";
  const locationDescription = location
    ? `${location.tinhThanh}, ${location.quocGia}`
    : `Mã vị trí: ${roomLocationId}`;

  const content = (
    <>
      <div
        className={`relative min-h-60 sm:min-h-52 overflow-hidden ${uiClassNames.locationImageSweep}`}
      >
        {imageSource ? (
          <Image
            fill
            alt={locationName}
            className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 60vw"
            src={imageSource}
          />
        ) : (
          <div className="grid h-full min-h-52 place-items-center bg-gradient-to-br from-gray-100 to-rose-50 dark:from-slate-800 dark:to-slate-900 text-5xl text-rose-300">
            ⌖
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-5 sm:p-6">
        <p className="text-lg font-bold text-gray-950 dark:text-white transition-colors duration-300 group-hover:text-rose-500">
          {locationName}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
          {locationDescription}
        </p>
        {location && (
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
            Xem thêm về địa điểm{" "}
            <i aria-hidden="true" className="fa-solid fa-chevron-right text-[10px]" />
          </span>
        )}
      </div>
    </>
  );

  const className =
    "group mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-slate-800/40 sm:grid-cols-[1.4fr_1fr] transition-all hover:border-rose-400/40";

  if (!location) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link className={className} href={`/locations/${location.id}`}>
      {content}
    </Link>
  );
};

export default RoomLocationCard;
