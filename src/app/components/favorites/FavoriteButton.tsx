"use client";

import type { MouseEvent } from "react";

import { OPEN_SIGN_IN_EVENT } from "@/app/lib/auth-events";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useFavoritesStore } from "@/app/store/useFavoritesStore";
import { useToastStore } from "@/app/store/useToastStore";

type FavoriteButtonProps = {
  roomId: number;
};

const FavoriteButton = ({ roomId }: FavoriteButtonProps) => {
  const user = useAuthStore((state) => state.user);
  const favoritesHydrated = useFavoritesStore((state) => state.hydrated);
  const favorite = useFavoritesStore((state) => state.roomIds.includes(roomId));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const showToast = useToastStore((state) => state.showToast);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      window.dispatchEvent(new Event(OPEN_SIGN_IN_EVENT));
      return;
    }

    toggleFavorite(roomId);
    showToast(
      favorite ? "Đã xóa khỏi phòng yêu thích" : "Đã thêm vào phòng yêu thích",
    );
  };

  return (
    <button
      aria-label={
        favorite
          ? "Xóa khỏi danh sách yêu thích"
          : "Thêm vào danh sách yêu thích"
      }
      aria-pressed={favorite}
      className={`absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg shadow-md backdrop-blur transition-[color,background-color,transform] duration-200 hover:scale-105 hover:bg-white ${
        favorite ? "text-rose-500" : "text-gray-700 hover:text-rose-500"
      }`}
      disabled={!favoritesHydrated}
      title={favorite ? "Xóa khỏi phòng yêu thích" : "Thêm vào phòng yêu thích"}
      type="button"
      onClick={handleClick}
    >
      <i aria-hidden="true" className="fa-regular fa-heart" />
    </button>
  );
};

export default FavoriteButton;
