"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { uiClassNames } from "@/app/lib/styles";

type RoomGalleryProps = {
  imageSource: string | null;
  roomName: string;
};

const RoomGallery = ({ imageSource, roomName }: RoomGalleryProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className="group relative mt-6 w-full overflow-hidden rounded-3xl bg-gray-100 shadow-sm"
        data-room-gallery="true"
      >
        <div className="relative h-90 w-full sm:h-130 lg:h-170">
          {imageSource ? (
            <Image
              fill
              priority
              alt={roomName}
              className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015]"
              sizes="(max-width: 1280px) calc(100vw - 32px), 1280px"
              src={imageSource}
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-rose-50 to-gray-100 text-6xl text-rose-300">
              ⌂
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950/25 via-transparent to-transparent" />
        </div>

        {imageSource && (
          <button
            className="absolute right-4 bottom-4 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-lg backdrop-blur hover:bg-white sm:right-6 sm:bottom-6"
            type="button"
            onClick={() => setOpen(true)}
          >
            Xem ảnh phòng
          </button>
        )}
      </div>

      {open &&
        imageSource &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-label={`Ảnh phòng ${roomName}`}
            aria-modal="true"
            className="fixed inset-0 z-[120] bg-black"
            data-room-gallery-modal="true"
            role="dialog"
          >
            <div className="relative h-full w-full">
              <Image
                fill
                priority
                alt={roomName}
                className="object-contain"
                sizes="100vw"
                src={imageSource}
              />
            </div>
            <button
              aria-label="Đóng ảnh phòng"
              className={`${uiClassNames.iconButton} absolute top-4 right-4 h-11 w-11 border-white/70 bg-white/95 text-2xl text-gray-950 shadow-lg sm:top-6 sm:right-6`}
              type="button"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default RoomGallery;
