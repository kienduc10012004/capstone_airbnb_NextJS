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
        className={`relative min-h-64 overflow-hidden ${uiClassNames.locationImageSweep}`}
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
          <div className="grid h-full min-h-64 place-items-center bg-gradient-to-br from-gray-100 to-rose-50 text-5xl text-rose-300">
            ⌖
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <p className="text-lg font-semibold text-gray-950 transition-colors duration-300 group-hover:text-rose-500">
          {locationName}
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {locationDescription}
        </p>
        {location && (
          <span className="mt-5 text-sm font-semibold text-gray-900">
            Xem địa điểm{" "}
            <i aria-hidden="true" className="fa-solid fa-chevron-right" />
          </span>
        )}
      </div>
    </>
  );
  const className =
    "group mt-5 grid grid-cols-1 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 sm:grid-cols-[1.5fr_1fr]";

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
