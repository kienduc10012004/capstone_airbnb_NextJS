"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import RoomCard from "@/app/components/RoomCard";
import { buttonClassName } from "@/app/components/ui/Button";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import {
  getAllRooms,
  getLocations,
  type ApiLocation,
  type ApiRoom,
} from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useFavoritesStore } from "@/app/store/useFavoritesStore";

const FavoritesPageContent = () => {
  const authHydrated = useAuthStore((state) => state.hydrated);
  const favoritesHydrated = useFavoritesStore((state) => state.hydrated);
  const favoriteRoomIds = useFavoritesStore((state) => state.roomIds);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!authHydrated || !favoritesHydrated) return;

    let active = true;

    Promise.all([getAllRooms(), getLocations()])
      .then(([roomsResponse, locationsResponse]) => {
        if (!active) return;
        setRooms(roomsResponse.content);
        setLocations(locationsResponse.content);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authHydrated, favoritesHydrated]);

  const favoriteRooms = useMemo(() => {
    const roomMap = new Map(rooms.map((room) => [room.id, room]));
    return favoriteRoomIds
      .map((roomId) => roomMap.get(roomId))
      .filter((room): room is ApiRoom => Boolean(room));
  }, [favoriteRoomIds, rooms]);
  const locationMap = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );

  if (!authHydrated || !favoritesHydrated) {
    return <LoadingState label="Đang tải..." />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${uiClassNames.appContainer} flex-1 py-8 sm:py-12`}>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-rose-500">Bộ sưu tập</p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900 sm:text-4xl">
            Phòng yêu thích
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Lưu lại những không gian bạn quan tâm để dễ dàng xem và đặt phòng
            sau này.
          </p>
        </div>

        {loading ? (
          <LoadingState label="Đang tải..." />
        ) : loadError ? (
          <div className="mt-8">
            <EmptyState
              action={
                <button
                  className={buttonClassName("secondary")}
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </button>
              }
              description="Không thể tải dữ liệu phòng. Vui lòng thử lại sau."
              icon="!"
              title="Có lỗi xảy ra"
            />
          </div>
        ) : favoriteRooms.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-medium text-gray-600">
              {favoriteRooms.length} phòng đã lưu
            </p>
            <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  location={locationMap.get(room.maViTri)}
                  room={room}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-8">
            <EmptyState
              action={
                <Link className={buttonClassName()} href="/rooms">
                  Khám phá phòng ở
                </Link>
              }
              description="Bấm vào biểu tượng trái tim trên card phòng để lưu phòng vào danh sách này."
              icon="♡"
              title="Bạn chưa có phòng yêu thích"
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPageContent;
