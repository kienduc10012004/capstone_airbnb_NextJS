import Image from "next/image";
import Link from "next/link";

import type { ApiLocation } from "@/app/lib/api";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";

const LocationCard = ({
  location,
  priority = false,
}: {
  location: ApiLocation;
  priority?: boolean;
}) => {
  const imageSource = getImageSource(location.hinhAnh);
  return (
    <Link
      className={`group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-sm ${uiClassNames.locationImageSweep}`}
      href={`/locations/${location.id}`}
    >
      {imageSource ? (
        <Image
          fill
          priority={priority}
          alt={`${location.tenViTri}, ${location.tinhThanh}`}
          className={`${uiClassNames.cardImageZoom} group-hover:scale-105`}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
          src={imageSource}
        />
      ) : (
        <div className="h-full bg-gradient-to-br from-rose-100 to-gray-200" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/75 via-transparent to-transparent" />
      <div className="absolute right-0 bottom-0 left-0 p-5 text-white">
        <h3 className="text-lg font-semibold">{location.tenViTri}</h3>
        <p className="mt-1 text-sm text-white/80">
          {location.tinhThanh}, {location.quocGia}
        </p>
      </div>
    </Link>
  );
};

export default LocationCard;
