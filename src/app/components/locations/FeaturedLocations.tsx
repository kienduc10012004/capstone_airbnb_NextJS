"use client";

import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, type PointerEvent, useRef, useState } from "react";

import type { ApiLocation } from "@/app/lib/api";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";

type FeaturedLocationsProps = {
  locations: ApiLocation[];
};

const DRAG_EXPANSION_DISTANCE = 180;
const DRAG_COMMIT_PROGRESS = 0.35;
const ACTIVE_FLEX_GROW = 3.25;
const COLLAPSED_FLEX_GROW = 1;
const ACTIVE_MOBILE_HEIGHT = 320;
const COLLAPSED_MOBILE_HEIGHT = 96;
const RIGHT_CHEVRON_DELAYS = [
  "[animation-delay:0ms]",
  "[animation-delay:300ms]",
  "[animation-delay:600ms]",
] as const;
const LEFT_CHEVRON_DELAYS = [...RIGHT_CHEVRON_DELAYS].reverse();

const TRAVEL_TIME_HINTS: Record<string, string> = {
  "Hồ Chí Minh": "15 phút lái xe",
  "Cần Thơ": "3 giờ lái xe",
  "Nha Trang": "6.5 giờ lái xe",
  "Hà Nội": "15 phút lái xe",
  "Hòn Tằm": "6.5 giờ lái xe",
  "Phú Quốc": "7.5 giờ lái xe",
  "Đà Nẵng": "45 phút lái xe",
  "Đà Lạt": "30 phút lái xe",
};

const FeaturedLocations = ({ locations }: FeaturedLocationsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOnDesktop, setDragOnDesktop] = useState(true);
  const [dragProgress, setDragProgress] = useState(0);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const dragStarted = useRef(false);
  const dragTargetIndexRef = useRef<number | null>(null);
  const pointerStartPosition = useRef<number | null>(null);
  const featuredLocations = locations.slice(0, 4);

  //==== Kéo accordion địa điểm: tính tiến trình co giãn và đổi thẻ đang mở ====
  const startDragging = (event: PointerEvent<HTMLElement>, index: number) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragTargetIndexRef.current = index;
    setDragOnDesktop(window.matchMedia("(min-width: 768px)").matches);
    pointerStartPosition.current = event.clientX;
    dragStarted.current = false;
    setDragProgress(0);
    setDragTargetIndex(index);
  };

  const updateDragPosition = (event: PointerEvent<HTMLElement>) => {
    const targetIndex = dragTargetIndexRef.current;
    if (pointerStartPosition.current === null || targetIndex === null) {
      return;
    }

    const offset = event.clientX - pointerStartPosition.current;
    if (Math.abs(offset) > 8) {
      if (!dragStarted.current) {
        dragStarted.current = true;
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Ignore capture error if uncaptured
          }
        }
      }
    }

    const directionTowardActive = targetIndex > activeIndex ? -1 : 1;
    const expansionDistance = offset * directionTowardActive;
    setDragProgress(
      Math.max(0, Math.min(1, expansionDistance / DRAG_EXPANSION_DISTANCE)),
    );
  };

  const finishDragging = (
    event: PointerEvent<HTMLElement>,
    cancelled = false,
  ) => {
    const targetIndex = dragTargetIndexRef.current;
    if (pointerStartPosition.current === null || targetIndex === null) {
      return;
    }

    if (dragStarted.current && !cancelled) {
      const directionTowardActive = targetIndex > activeIndex ? -1 : 1;
      const finalProgress = Math.max(
        0,
        Math.min(
          1,
          ((event.clientX - pointerStartPosition.current) *
            directionTowardActive) /
            DRAG_EXPANSION_DISTANCE,
        ),
      );
      if (finalProgress >= DRAG_COMMIT_PROGRESS) {
        setActiveIndex(targetIndex);
      }
    }

    pointerStartPosition.current = null;
    dragTargetIndexRef.current = null;
    setDragProgress(0);
    setDragTargetIndex(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore uncapture error
      }
    }
    window.setTimeout(() => {
      dragStarted.current = false;
    }, 50);
  };

  const [zoomLocation, setZoomLocation] = useState<ApiLocation | null>(null);

  //==== Chọn địa điểm: 1st click sổ ngang lớn hơn, 2nd click mới mở modal ====
  const selectCard = (event: MouseEvent<HTMLElement>, index: number, location: ApiLocation) => {
    if (dragStarted.current) {
      event.preventDefault();
      return;
    }
    if (index === activeIndex) {
      // Bấm lần thứ hai (thẻ đã mở) -> Mở modal xem chi tiết
      setZoomLocation(location);
    } else {
      // Bấm lần đầu (thẻ đang thu gọn) -> Sổ ngang lớn hơn (set active)
      setActiveIndex(index);
    }
  };

  //==== Giao diện địa điểm nổi bật: hiển thị bốn thẻ accordion responsive ====
  return (
    <>
      <div
        className={`flex touch-pan-y flex-col gap-3 select-none md:h-120 md:flex-row md:gap-4 ${
          dragTargetIndex !== null ? "cursor-grabbing" : "cursor-grab"
        }`}
        onDragStart={(event) => event.preventDefault()}
      >
        {featuredLocations.map((location, index) => {
          const isCaiRang = location.tenViTri.includes("Cái Răng");
          const displayTitle = isCaiRang ? "Hòn Tằm" : location.tenViTri;
          const displaySubtitle = isCaiRang ? "Nha Trang, Việt Nam" : `${location.tinhThanh}, ${location.quocGia}`;
          const imageSource = isCaiRang
            ? "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80"
            : getImageSource(location.hinhAnh, index);

          const displayLocation = isCaiRang
            ? { ...location, tenViTri: "Hòn Tằm", tinhThanh: "Nha Trang", hinhAnh: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80" }
            : location;

          const active = index === activeIndex;
          const dragTarget = index === dragTargetIndex;
          const participatesInDrag =
            dragTargetIndex !== null && (active || dragTarget);
          const dragStyle = participatesInDrag
            ? dragOnDesktop
              ? {
                  flexGrow: active
                    ? ACTIVE_FLEX_GROW -
                      (ACTIVE_FLEX_GROW - COLLAPSED_FLEX_GROW) * dragProgress
                    : COLLAPSED_FLEX_GROW +
                      (ACTIVE_FLEX_GROW - COLLAPSED_FLEX_GROW) * dragProgress,
                  transitionDuration: "0ms",
                }
              : {
                  height: `${
                    active
                      ? ACTIVE_MOBILE_HEIGHT -
                        (ACTIVE_MOBILE_HEIGHT - COLLAPSED_MOBILE_HEIGHT) *
                          dragProgress
                      : COLLAPSED_MOBILE_HEIGHT +
                        (ACTIVE_MOBILE_HEIGHT - COLLAPSED_MOBILE_HEIGHT) *
                          dragProgress
                  }px`,
                  transitionDuration: "0ms",
                }
            : undefined;

          return (
            <article
              className={`group relative min-h-24 overflow-hidden rounded-3xl bg-gray-900 shadow-lg transition-[flex-grow,height,box-shadow,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-full ${uiClassNames.locationImageSweep} ${
                active
                  ? "h-80 shadow-2xl md:flex-[3.25]"
                  : "h-24 hover:shadow-xl md:flex-1"
              }`}
              data-location-index={index}
              key={location.id}
              style={dragStyle}
              onPointerCancel={(event) => finishDragging(event, true)}
              onPointerDown={(event) => startDragging(event, index)}
              onPointerMove={updateDragPosition}
              onPointerUp={finishDragging}
            >
              <button
                aria-label={`Chọn địa điểm ${displayTitle}`}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer text-left focus:outline-none"
                type="button"
                onClick={(event) => selectCard(event, index, displayLocation)}
              />
              {imageSource ? (
                <Image
                  fill
                  draggable={false}
                  priority={index === 0}
                  alt={`${displayTitle}, ${displaySubtitle}`}
                  className={`${uiClassNames.cardImageZoom} ${
                    active ? "scale-100" : "scale-105"
                  } group-hover:scale-[1.035]`}
                  sizes="(max-width: 767px) 100vw, 55vw"
                  src={imageSource}
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-rose-300 via-pink-500 to-gray-900" />
              )}
              <div
                className={`absolute inset-0 transition-colors duration-700 ${
                  active
                    ? "bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent"
                    : "bg-gray-950/45"
                }`}
              />
              {!active && !dragTarget && (
                <div
                  aria-hidden="true"
                  data-drag-hint={index < activeIndex ? "right" : "left"}
                  className="pointer-events-none absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center text-3xl font-bold tracking-[-0.18em] text-white drop-shadow-lg"
                >
                  {(index < activeIndex
                    ? RIGHT_CHEVRON_DELAYS
                    : LEFT_CHEVRON_DELAYS
                  ).map((delayClass, chevronIndex) => (
                    <span
                      className={`inline-block animate-ping [animation-duration:1.8s] ${delayClass}`}
                      key={`${delayClass}-${chevronIndex}`}
                    >
                      <i
                        aria-hidden="true"
                        className={
                          index < activeIndex
                            ? "fa-solid fa-chevron-right"
                            : "fa-solid fa-chevron-left"
                        }
                      />
                    </span>
                  ))}
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 text-white md:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className={`overflow-hidden text-xs font-semibold uppercase tracking-[0.18em] text-rose-200 transition-all duration-500 ${
                        active
                          ? "mb-2 max-h-6 opacity-100"
                          : "mb-0 max-h-0 opacity-0"
                      }`}
                    >
                      Điểm đến nổi bật
                    </p>
                    <h3
                      className={`font-semibold transition-[font-size] duration-700 ${
                        active ? "text-2xl sm:text-3xl" : "text-base lg:text-lg"
                      }`}
                    >
                      {displayTitle}
                    </h3>
                    <p
                      className={`overflow-hidden text-sm text-white/75 transition-all duration-500 ${
                        active
                          ? "mt-1 max-h-8 opacity-100"
                          : "mt-0 max-h-0 opacity-0"
                      }`}
                    >
                      {displaySubtitle} · {TRAVEL_TIME_HINTS[displayTitle] || "30 phút lái xe"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Phóng to ảnh điểm đến"
                      title="Phóng to điểm đến"
                      className={`pointer-events-auto relative z-30 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur shadow-md transition-all duration-500 hover:scale-110 hover:bg-white hover:text-gray-900 ${
                        active
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-3 opacity-0"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setZoomLocation(location);
                      }}
                    >
                      <i className="fa-solid fa-expand text-base" />
                    </button>
                    <Link
                      className={`pointer-events-auto relative z-30 inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-gray-950 shadow-md transition-all duration-500 hover:scale-105 hover:bg-rose-500 hover:text-white ${
                        active
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-3 opacity-0"
                      }`}
                      href={`/locations/${location.id}`}
                      aria-label={`Xem chi tiết ${location.tenViTri}`}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Lightbox Zoom Modal for Destination */}
      {zoomLocation && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all"
          onClick={() => setZoomLocation(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-gray-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-gray-950 backdrop-blur hover:bg-white"
              onClick={() => setZoomLocation(null)}
              aria-label="Đóng"
            >
              <i className="fa-solid fa-xmark text-xl" />
            </button>
            <div className="relative h-[60vh] w-full bg-black">
              {getImageSource(zoomLocation.hinhAnh) ? (
                <Image
                  fill
                  alt={zoomLocation.tenViTri}
                  className="object-contain"
                  src={getImageSource(zoomLocation.hinhAnh)!}
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="grid h-full place-items-center bg-gray-900 text-white">
                  Không có hình ảnh
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/90 p-6 text-white">
              <div>
                <h2 className="text-2xl font-bold">{zoomLocation.tenViTri}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {zoomLocation.tinhThanh}, {zoomLocation.quocGia}
                </p>
              </div>
              <Link
                href={`/locations/${zoomLocation.id}`}
                className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-rose-600"
                onClick={() => setZoomLocation(null)}
              >
                Khám phá ngay
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeaturedLocations;
