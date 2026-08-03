"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { buttonClassName } from "@/app/components/ui/Button";
import { uiClassNames } from "@/app/lib/styles";

const AUTOPLAY_DELAY = 4000;
const DRAG_THRESHOLD = 60;

const bannerSlides = [
  {
    badge: "Chuyến đi tiếp theo bắt đầu tại đây",
    description:
      "Khám phá những căn phòng phù hợp với phong cách, ngân sách và hành trình của bạn.",
    image: "/image/banner-airbnb-1.png",
    title: (
      <>
        Ở theo cách của bạn,
        <span className="block bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent">
          nhớ theo cách rất riêng.
        </span>
      </>
    ),
  },
  {
    badge: "Khám phá những miền đất mới",
    description:
      "Tìm cảm hứng cho hành trình tiếp theo từ những thành phố sôi động đến các điểm nghỉ dưỡng bình yên.",
    href: "/locations",
    image: "/image/banner-airbnb-2.png",
    linkLabel: "Xem địa điểm",
    title: (
      <>
        Mỗi địa điểm,
        <span className="block bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent">
          một câu chuyện mới.
        </span>
      </>
    ),
  },
  {
    badge: "Không gian dành riêng cho bạn",
    description:
      "Khám phá đa dạng phòng ở với mức giá, tiện nghi và sức chứa phù hợp cho từng chuyến đi.",
    href: "/rooms",
    image: "/image/banner-airbnb-3.png",
    linkLabel: "Xem phòng",
    title: (
      <>
        Chọn căn phòng phù hợp,
        <span className="block bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent">
          tận hưởng từng khoảnh khắc.
        </span>
      </>
    ),
  },
] as const;

const HomeBannerSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [interactionVersion, setInteractionVersion] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const pointerStartRef = useRef(0);

  //==== Autoplay banner: chuyển từng slide và khởi động lại bộ đếm sau tương tác ====
  useEffect(() => {
    if (isDragging) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) =>
        current === bannerSlides.length - 1 ? 0 : current + 1,
      );
    }, AUTOPLAY_DELAY);

    return () => window.clearTimeout(timer);
  }, [activeIndex, interactionVersion, isDragging]);

  const resetAutoplay = () => {
    setInteractionVersion((current) => current + 1);
  };

  const showNextSlide = () => {
    setActiveIndex((current) =>
      current === bannerSlides.length - 1 ? 0 : current + 1,
    );
    resetAutoplay();
  };

  const showPreviousSlide = () => {
    setActiveIndex((current) =>
      current === 0 ? bannerSlides.length - 1 : current - 1,
    );
    resetAutoplay();
  };

  const selectSlide = (index: number) => {
    setActiveIndex(index);
    resetAutoplay();
  };

  //==== Kéo banner: theo dõi khoảng kéo và chỉ chuyển slide khi vượt ngưỡng ====
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    activePointerIdRef.current = event.pointerId;
    pointerStartRef.current = event.clientX;
    dragOffsetRef.current = 0;
    draggedRef.current = false;
    setIsDragging(true);
    resetAutoplay();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const offset = event.clientX - pointerStartRef.current;
    dragOffsetRef.current = offset;
    if (Math.abs(offset) > 5) {
      draggedRef.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    setDragOffset(offset);
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const finalOffset = dragOffsetRef.current;
    if (finalOffset <= -DRAG_THRESHOLD) {
      showNextSlide();
    } else if (finalOffset >= DRAG_THRESHOLD) {
      showPreviousSlide();
    } else {
      resetAutoplay();
    }

    activePointerIdRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  //==== Giao diện banner slider: hiển thị nội dung, điều hướng và chỉ báo slide ====
  return (
    <div
      aria-label="Banner khám phá Airbnb"
      aria-roledescription="carousel"
      className="relative z-30 rounded-3xl bg-gray-950 shadow-xl"
      role="region"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPreviousSlide();
        if (event.key === "ArrowRight") showNextSlide();
      }}
    >
      <button
        aria-label="Xem banner trước"
        className={`${uiClassNames.iconButton} absolute top-1/2 left-[5px] z-40 h-11 w-11 -translate-y-1/2 border-white/60 bg-white/90 opacity-55 hover:opacity-100 sm:h-12 sm:w-12`}
        type="button"
        onClick={showPreviousSlide}
      >
        <i aria-hidden="true" className="fa-solid fa-chevron-left" />
      </button>
      <button
        aria-label="Xem banner tiếp theo"
        className={`${uiClassNames.iconButton} absolute top-1/2 right-[5px] z-40 h-11 w-11 -translate-y-1/2 border-white/60 bg-white/90 opacity-55 hover:opacity-100 sm:h-12 sm:w-12`}
        type="button"
        onClick={showNextSlide}
      >
        <i aria-hidden="true" className="fa-solid fa-chevron-right" />
      </button>

      <div className="overflow-hidden rounded-3xl">
        <div
          className={`flex touch-pan-y select-none ${
            isDragging
              ? "cursor-grabbing"
              : "cursor-grab transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          }`}
          style={{
            transform: `translate3d(calc(${-activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
          }}
          onClickCapture={(event) => {
            if (!draggedRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            draggedRef.current = false;
          }}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={finishDragging}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
        >
          {bannerSlides.map((slide, index) => (
            <article
              aria-hidden={activeIndex !== index}
              aria-label={`${index + 1} / ${bannerSlides.length}`}
              className="relative h-[380px] w-full shrink-0 overflow-hidden px-5 py-12 text-white sm:h-[440px] sm:px-10 sm:py-16 lg:h-[500px] lg:px-16 lg:py-20"
              key={slide.image}
            >
              <Image
                fill
                alt=""
                aria-hidden="true"
                className="pointer-events-none object-cover object-center"
                preload={index === 0}
                sizes="(max-width: 1280px) calc(100vw - 32px), 1280px"
                src={slide.image}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/40" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/10" />
              <div className="relative flex h-full max-w-3xl flex-col justify-center">
                <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-widest text-rose-100 uppercase backdrop-blur-sm">
                  {slide.badge}
                </span>
                <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-200 sm:text-base">
                  {slide.description}
                </p>
                {"href" in slide && (
                  <div className="mt-7">
                    <Link
                      className={buttonClassName(
                        "secondary",
                        "border-white/70 bg-white px-5 text-gray-950 hover:border-white hover:bg-white",
                      )}
                      href={slide.href}
                      tabIndex={activeIndex === index ? 0 : -1}
                    >
                      {slide.linkLabel}
                      <i
                        aria-hidden="true"
                        className="fa-solid fa-chevron-right text-xs"
                      />
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm sm:bottom-5">
        {bannerSlides.map((slide, index) => (
          <button
            aria-label={`Chuyển đến banner ${index + 1}`}
            aria-pressed={activeIndex === index}
            className={`h-2.5 rounded-full transition-[width,background-color,opacity] duration-500 ease-out ${
              activeIndex === index
                ? "w-8 bg-white"
                : "w-2.5 bg-white/55 hover:bg-white/90"
            }`}
            key={slide.image}
            type="button"
            onClick={() => selectSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeBannerSlider;
