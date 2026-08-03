import type { ApiLocation } from "@/app/lib/api";

type RoomMapProps = {
  location: ApiLocation | null;
};

const RoomMap = ({ location }: RoomMapProps) => {
  if (!location) {
    return (
      <div className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
        Bản đồ sẽ hiển thị khi thông tin vị trí được cập nhật.
      </div>
    );
  }

  const locationQuery = [
    location.tenViTri,
    location.tinhThanh,
    location.quocGia,
  ].join(", ");
  const mapSource = `https://www.google.com/maps?q=${encodeURIComponent(
    locationQuery,
  )}&output=embed`;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm">
      <iframe
        allowFullScreen
        className="h-72 w-full border-0 sm:h-88"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={mapSource}
        title={`Bản đồ ${locationQuery}`}
      />
    </div>
  );
};

export default RoomMap;
