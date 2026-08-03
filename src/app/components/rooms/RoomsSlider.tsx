"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import RoomCard from "@/app/components/RoomCard";
import type { ApiLocation, ApiRoom } from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";

const CARD_GAP = 20;
const AUTOPLAY_DELAY = 4000;

type RoomsSliderProps = {
  ariaLabel?: string;
  id?: string;
  location?: ApiLocation;
  locations?: ApiLocation[];
  ratings?: Record<number, number>;
  rooms: ApiRoom[];
};

const getVisibleCount = (width: number) => {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
};

const RoomsSlider = ({
  ariaLabel = "Danh sách phòng dạng trượt",
  id = "rooms-slider",
  location,
  locations = [],
  ratings = {},
  rooms,
}: RoomsSliderProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [interactionVersion, setInteractionVersion] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const activePointerIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const pointerStartRef = useRef(0);
  const draggedRef = useRef(false);
  const visibleCount = getVisibleCount(containerWidth);
  const maxPosition = Math.max(rooms.length - visibleCount, 0);
  const cardWidth =
    containerWidth > 0
      ? (containerWidth - CARD_GAP * (visibleCount - 1)) / visibleCount
      : 0;
  const stepWidth = cardWidth + CARD_GAP;

  //==== Kích thước slider phòng: tính số card và chiều rộng theo viewport ====
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const nextVisibleCount = getVisibleCount(width);
      setContainerWidth(width);
      setPosition((current) =>
        Math.min(current, Math.max(rooms.length - nextVisibleCount, 0)),
      );
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [rooms.length]);

  //==== Autoplay slider phòng: chuyển một card và đặt lại bộ đếm sau tương tác ====
  useEffect(() => {
    if (!containerWidth || isDragging || maxPosition === 0) return;

    const timer = window.setTimeout(() => {
      setPosition((current) => (current >= maxPosition ? 0 : current + 1));
    }, AUTOPLAY_DELAY);

    return () => window.clearTimeout(timer);
  }, [containerWidth, interactionVersion, isDragging, maxPosition, position]);

  const resetAutoplayDebounce = () => {
    setInteractionVersion((current) => current + 1);
  };

  const showNextRooms = () => {
    setTransitionEnabled(true);
    setPosition((current) => (current >= maxPosition ? 0 : current + 1));
    resetAutoplayDebounce();
  };

  const showPreviousRooms = () => {
    setTransitionEnabled(true);
    setPosition((current) => (current <= 0 ? maxPosition : current - 1));
    resetAutoplayDebounce();
  };

  //==== Kéo slider phòng: chuyển card theo ngưỡng và chặn click nhầm sau khi kéo ====
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    activePointerIdRef.current = event.pointerId;
    pointerStartRef.current = event.clientX;
    dragOffsetRef.current = 0;
    draggedRef.current = false;
    setIsDragging(true);
    setTransitionEnabled(false);
    resetAutoplayDebounce();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const offset = event.clientX - pointerStartRef.current;
    const isDraggingPastFirstRoom = position === 0 && offset > 0;
    const isDraggingPastLastRoom = position === maxPosition && offset < 0;
    dragOffsetRef.current = offset;

    if (Math.abs(offset) > 5) {
      draggedRef.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    setDragOffset(
      isDraggingPastFirstRoom || isDraggingPastLastRoom ? 0 : offset,
    );
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const threshold = Math.min(60, stepWidth * 0.2);
    const finalDragOffset = dragOffsetRef.current;
    setTransitionEnabled(true);

    if (finalDragOffset <= -threshold) {
      showNextRooms();
    } else if (finalDragOffset >= threshold) {
      showPreviousRooms();
    } else {
      resetAutoplayDebounce();
    }
    activePointerIdRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  //==== Giao diện slider phòng: hiển thị track, card và nút điều hướng responsive ====
  return (
    <div
      aria-label={ariaLabel}
      className="mt-6"
      data-related-slider
      id={id}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPreviousRooms();
        if (event.key === "ArrowRight") showNextRooms();
      }}
      role="region"
      tabIndex={0}
    >
      <div className="relative">
        <button
          aria-label="Xem phòng trước"
          className={`${uiClassNames.iconButton} absolute top-1/2 left-0 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-xl opacity-40 hover:opacity-100`}
          type="button"
          onClick={showPreviousRooms}
        >
          <i aria-hidden="true" className="fa-solid fa-chevron-left" />
        </button>
        <button
          aria-label="Xem phòng tiếp theo"
          className={`${uiClassNames.iconButton} absolute top-1/2 right-0 z-10 h-12 w-12 translate-x-1/2 -translate-y-1/2 text-xl opacity-40 hover:opacity-100`}
          type="button"
          onClick={showNextRooms}
        >
          <i aria-hidden="true" className="fa-solid fa-chevron-right" />
        </button>

        <div
          className="cursor-grab overflow-hidden select-none active:cursor-grabbing"
          ref={containerRef}
        >
          <div
            className={`flex touch-pan-y ${transitionEnabled ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
            data-related-slider-track
            style={{
              columnGap: `${CARD_GAP}px`,
              transform: `translate3d(${-position * stepWidth + dragOffset}px, 0, 0)`,
            }}
            onClickCapture={(event) => {
              if (draggedRef.current) {
                event.preventDefault();
                event.stopPropagation();
                draggedRef.current = false;
              }
            }}
            onDragStart={(event) => event.preventDefault()}
            onPointerCancel={finishDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDragging}
          >
            {rooms.map((room) => {
              const roomLocation =
                location ??
                locations.find(
                  (candidateLocation) => candidateLocation.id === room.maViTri,
                );

              return (
                <div
                  className="w-full min-w-0 shrink-0 sm:w-[calc((100%_-_20px)/2)] lg:w-[calc((100%_-_60px)/4)]"
                  key={room.id}
                  style={
                    cardWidth > 0 ? { width: `${cardWidth}px` } : undefined
                  }
                >
                  <RoomCard
                    location={roomLocation}
                    rating={ratings[room.id]}
                    room={room}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsSlider;
