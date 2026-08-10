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
      className={`absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-base shadow-md backdrop-blur transition-all duration-200 hover:scale-110 active:scale-95 ${
        favorite
          ? "bg-white text-rose-500"
          : "bg-white/90 text-gray-900/60 hover:text-rose-500"
      }`}
      disabled={!favoritesHydrated}
      title={favorite ? "Xóa khỏi phòng yêu thích" : "Thêm vào phòng yêu thích"}
      type="button"
      onClick={handleClick}
    >
      <i
        aria-hidden="true"
        className={favorite ? "fa-solid fa-heart" : "fa-solid fa-heart"}
      />
    </button>
  );
};

export default FavoriteButton;
