"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type RoomGalleryProps = {
  imageSource: string | null;
  images?: string[];
  roomName: string;
};

// High quality fallback room perspective photos for Airbnb grid showcase
const DEFAULT_ROOM_GALLERY_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
];

const RoomGallery = ({ imageSource, images, roomName }: RoomGalleryProps) => {
  const [open, setOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Combine provided main image and additional photos into a 5-photo list
  const mainImage = imageSource || DEFAULT_ROOM_GALLERY_PLACEHOLDERS[0];
  const galleryList: string[] = images && images.length > 0 
    ? [mainImage, ...images.filter(img => img !== mainImage)].slice(0, 5)
    : [
        mainImage,
        DEFAULT_ROOM_GALLERY_PLACEHOLDERS[1],
        DEFAULT_ROOM_GALLERY_PLACEHOLDERS[2],
        DEFAULT_ROOM_GALLERY_PLACEHOLDERS[3],
        DEFAULT_ROOM_GALLERY_PLACEHOLDERS[4],
      ];

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      } else if (event.key === "ArrowRight") {
        setActivePhotoIndex((prev) => (prev + 1) % galleryList.length);
      } else if (event.key === "ArrowLeft") {
        setActivePhotoIndex((prev) => (prev - 1 + galleryList.length) % galleryList.length);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open, galleryList.length]);

  const openModalAtIndex = (index: number) => {
    setActivePhotoIndex(index);
    setOpen(true);
  };

  return (
    <>
      {/* Airbnb Multi-Photo Grid (Matching exact Airbnb room detail layout) */}
      <div
        className="group relative mt-6 w-full overflow-hidden rounded-3xl bg-gray-100 shadow-sm"
        data-room-gallery="true"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-2.5 h-[340px] sm:h-[420px] lg:h-[480px]">
          {/* Main Hero Photo (Left Half) */}
          <div 
            className="group/photo relative cursor-pointer overflow-hidden md:col-span-2 md:row-span-2 h-full w-full"
            onClick={() => openModalAtIndex(0)}
          >
            <Image
              fill
              priority
              alt={`${roomName} - Ảnh chính`}
              className="object-cover transition-transform duration-700 ease-out group-hover/photo:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              src={galleryList[0]}
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/photo:bg-black/10" />
          </div>

          {/* 4 Supporting Photos (Right 2x2 Grid) */}
          {galleryList.slice(1, 5).map((imgUrl, idx) => (
            <div
              key={idx + 1}
              className="group/photo relative hidden cursor-pointer overflow-hidden md:block h-full w-full"
              onClick={() => openModalAtIndex(idx + 1)}
            >
              <Image
                fill
                alt={`${roomName} - Góc nhìn ${idx + 2}`}
                className="object-cover transition-transform duration-700 ease-out group-hover/photo:scale-105"
                sizes="25vw"
                src={imgUrl}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/photo:bg-black/10" />
            </div>
          ))}
        </div>

        {/* Floating "Xem ảnh phòng" Button */}
        <button
          className="absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-xl border border-gray-900/10 bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-[1.02] sm:right-6 sm:bottom-6"
          type="button"
          onClick={() => openModalAtIndex(0)}
        >
          <i className="fa-solid fa-border-all text-sm" />
          <span>Xem ảnh phòng</span>
        </button>
      </div>

      {/* Un-cropped Lightbox Modal Viewer */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-label={`Bộ ảnh phòng ${roomName}`}
            aria-modal="true"
            className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-xl"
            data-room-gallery-modal="true"
            role="dialog"
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-white">
              <div>
                <h2 className="text-base font-bold sm:text-lg">{roomName}</h2>
                <p className="text-xs text-white/60">
                  Ảnh {activePhotoIndex + 1} / {galleryList.length}
                </p>
              </div>
              <button
                aria-label="Đóng ảnh phòng"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
                type="button"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Main Un-cropped Image View */}
            <div className="relative flex-1 p-4 sm:p-8">
              <div className="relative h-full w-full">
                <Image
                  fill
                  priority
                  alt={`${roomName} - Full view`}
                  className="object-contain"
                  sizes="100vw"
                  src={galleryList[activePhotoIndex]}
                />
              </div>

              {/* Prev / Next Navigation Arrows */}
              <button
                type="button"
                aria-label="Ảnh trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur hover:bg-white hover:text-gray-950 sm:left-8"
                onClick={() =>
                  setActivePhotoIndex(
                    (prev) => (prev - 1 + galleryList.length) % galleryList.length,
                  )
                }
              >
                <i className="fa-solid fa-chevron-left text-lg" />
              </button>
              <button
                type="button"
                aria-label="Ảnh kế tiếp"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur hover:bg-white hover:text-gray-950 sm:right-8"
                onClick={() =>
                  setActivePhotoIndex((prev) => (prev + 1) % galleryList.length)
                }
              >
                <i className="fa-solid fa-chevron-right text-lg" />
              </button>
            </div>

            {/* Bottom Thumbnail Navigation Strip */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto border-t border-white/10 bg-black/60 p-4">
              {galleryList.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhotoIndex(i)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    activePhotoIndex === i
                      ? "border-rose-500 scale-105 opacity-100 shadow-md"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    fill
                    alt={`Thumbnail ${i + 1}`}
                    className="object-cover"
                    src={url}
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default RoomGallery;
