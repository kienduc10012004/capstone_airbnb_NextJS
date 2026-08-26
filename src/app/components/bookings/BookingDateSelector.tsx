"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addMonths,
  formatDisplayDate,
  formatMonth,
  formatShortDate,
  fromDateKey,
  getCalendarDays,
  isBeforeToday,
  startOfMonth,
  toDateKey,
} from "@/app/components/search/date-utils";
import type { ApiBooking } from "@/app/lib/api/bookings";
import { normalizeDateKey } from "@/app/lib/booking-availability";
import { uiClassNames } from "@/app/lib/styles";

type BookingDateSelectorProps = {
  checkIn: string;
  checkOut: string;
  existingBookings?: ApiBooking[];
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSelectRange: (range: { checkIn: string; checkOut: string }) => void;
  roomId: number;
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

type CalendarMonthProps = {
  checkIn: string;
  checkOut: string;
  hoveredDate: Date | null;
  isDateDisabled: (date: Date, isSelectingEnd: boolean) => boolean;
  isDateOccupied: (date: Date) => boolean;
  month: Date;
  pickingEnd: boolean;
  onHover: (date: Date | null) => void;
  onSelect: (date: Date) => void;
};

const CalendarMonth = ({
  checkIn,
  checkOut,
  hoveredDate,
  isDateDisabled,
  isDateOccupied,
  month,
  pickingEnd,
  onHover,
  onSelect,
}: CalendarMonthProps) => (
  <div className="min-w-0 flex-1">
    <h4 className="text-center text-sm font-bold capitalize text-gray-900 dark:text-white">
      {formatMonth(month)}
    </h4>
    <div className="mt-3 grid grid-cols-7 text-center">
      {weekDays.map((day) => (
        <span
          className="py-1.5 text-[11px] font-semibold text-gray-400 dark:text-slate-400"
          key={day}
        >
          {day}
        </span>
      ))}
      {getCalendarDays(month).map((date, index) => {
        if (!date) {
          return <span key={`empty-${index}`} />;
        }

        const dateKey = toDateKey(date);
        const disabled = isDateDisabled(date, pickingEnd);
        const occupied = isDateOccupied(date);

        // Confirmed selection
        const isConfirmedStart = dateKey === checkIn;
        const isConfirmedEnd = dateKey === checkOut;

        const confirmedInRange =
          Boolean(checkIn && checkOut) &&
          date > fromDateKey(checkIn) &&
          date < fromDateKey(checkOut);

        // Hover preview (only when picking end date)
        const previewCheckOut =
          pickingEnd &&
          hoveredDate &&
          hoveredDate > fromDateKey(checkIn) &&
          !disabled
            ? hoveredDate
            : null;

        const isPreviewEnd =
          pickingEnd &&
          previewCheckOut !== null &&
          toDateKey(previewCheckOut) === dateKey;

        const inPreviewRange =
          Boolean(checkIn && previewCheckOut) &&
          date > fromDateKey(checkIn) &&
          date < previewCheckOut!;

        const inRange = previewCheckOut ? inPreviewRange : confirmedInRange;
        const isStart = isConfirmedStart;
        const isEnd = previewCheckOut ? isPreviewEnd : isConfirmedEnd;
        const selected = isStart || isEnd;

        const hasRange = Boolean(
          previewCheckOut ? checkIn && previewCheckOut : checkIn && checkOut,
        );
        const showRightHalf = hasRange && isStart;
        const showLeftHalf = hasRange && isEnd;

        return (
          <div
            className={`relative my-0.5 flex h-9 items-center justify-center transition-colors duration-100 ${
              inRange
                ? "bg-rose-100 dark:bg-rose-950/60"
                : showRightHalf
                  ? "bg-gradient-to-r from-transparent to-rose-100 dark:to-rose-950/60"
                  : showLeftHalf
                    ? "bg-gradient-to-l from-transparent to-rose-100 dark:to-rose-950/60"
                    : ""
            }`}
            key={dateKey}
          >
            <button
              aria-label={`${date.toLocaleDateString("vi-VN")}${
                occupied ? " - Đã có khách đặt" : ""
              }`}
              className={`relative z-10 grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                selected
                  ? "bg-rose-500 font-bold text-white shadow-md shadow-rose-500/30 scale-105"
                  : inRange
                    ? "text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60"
                    : occupied
                      ? "cursor-not-allowed text-gray-400/80 dark:text-slate-500 line-through bg-gray-100/60 dark:bg-slate-800/40"
                      : disabled
                        ? "cursor-not-allowed text-gray-300 dark:text-slate-600"
                        : "text-gray-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 cursor-pointer"
              }`}
              disabled={disabled}
              title={
                occupied
                  ? "Phòng đã có khách đặt ngày này"
                  : disabled
                    ? "Ngày không khả dụng"
                    : `Chọn ngày ${formatDisplayDate(dateKey)}`
              }
              type="button"
              onClick={() => onSelect(date)}
              onMouseEnter={() => !disabled && onHover(date)}
              onMouseLeave={() => onHover(null)}
            >
              {date.getDate()}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

const BookingDateSelector = ({
  checkIn,
  checkOut,
  existingBookings = [],
  isOpen: controlledIsOpen,
  onClose,
  onOpenChange,
  onSelectRange,
  roomId,
}: BookingDateSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isCalendarOpen = controlledIsOpen ?? internalIsOpen;

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(checkIn ? fromDateKey(checkIn) : new Date()),
  );
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // pickingEnd = đã có checkIn, đang chờ chọn checkOut
  const pickingEnd = Boolean(checkIn && !checkOut);

  const setOpen = useCallback(
    (open: boolean) => {
      setInternalIsOpen(open);
      onOpenChange?.(open);
      if (!open) {
        onClose?.();
        setHoveredDate(null);
      }
    },
    [onClose, onOpenChange],
  );

  // Lấy danh sách booking đã được chuẩn hóa của phòng
  const roomBookings = useMemo(() => {
    return (existingBookings || [])
      .filter((b) => b.maPhong === roomId)
      .map((b) => ({
        checkIn: normalizeDateKey(b.ngayDen),
        checkOut: normalizeDateKey(b.ngayDi),
      }))
      .filter((b) => b.checkIn && b.checkOut && b.checkIn < b.checkOut)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [existingBookings, roomId]);

  // Kiểm tra ngày có nằm trong đêm khách đang ở không [ngayDen, ngayDi)
  const isDateOccupied = useCallback(
    (date: Date): boolean => {
      const key = toDateKey(date);
      return roomBookings.some((b) => key >= b.checkIn && key < b.checkOut);
    },
    [roomBookings],
  );

  // Tính ngày check-out tối đa cho phép sau check-in
  const nextBlockedCheckIn = useMemo(() => {
    if (!checkIn) return null;
    const nextBooking = roomBookings.find((b) => b.checkIn > checkIn);
    return nextBooking ? nextBooking.checkIn : null;
  }, [checkIn, roomBookings]);

  // Kiểm tra ngày có bị vô hiệu hóa (disabled) không
  const isDateDisabled = useCallback(
    (date: Date, isSelectingEnd: boolean): boolean => {
      if (isBeforeToday(date)) return true;

      const key = toDateKey(date);

      if (isSelectingEnd && checkIn) {
        // Ngày trả phòng phải sau ngày nhận ít nhất 1 đêm
        if (key <= checkIn) return true;

        // Không cho phép chọn ngày trả phòng nhảy qua khoảng đã có khách đặt
        if (nextBlockedCheckIn && key > nextBlockedCheckIn) return true;

        return false;
      }

      // Khi chọn ngày nhận phòng: các ngày đã kín phòng thì disable
      return isDateOccupied(date);
    },
    [checkIn, isDateOccupied, nextBlockedCheckIn],
  );

  // Chọn ngày
  const handleSelectDate = (date: Date) => {
    const dateKey = toDateKey(date);

    // Nếu chưa có checkIn hoặc đã có đủ cả 2 ngày -> Bắt đầu chọn lại từ checkIn
    if (!checkIn || checkOut) {
      onSelectRange({ checkIn: dateKey, checkOut: "" });
      return;
    }

    // Nếu đang chọn checkOut nhưng người dùng click ngày <= checkIn -> Đặt lại checkIn
    if (dateKey <= checkIn) {
      onSelectRange({ checkIn: dateKey, checkOut: "" });
      return;
    }

    // Kiểm tra xem khoảng giữa checkIn và dateKey có booking nào chen ngang không
    if (nextBlockedCheckIn && dateKey > nextBlockedCheckIn) {
      onSelectRange({ checkIn: dateKey, checkOut: "" });
      return;
    }

    // Hoàn tất chọn khoảng ngày hợp lệ
    onSelectRange({ checkIn, checkOut: dateKey });
    setHoveredDate(null);
    setOpen(false);
  };

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen, setOpen]);

  // Số đêm đang chọn hoặc đang preview
  const currentNights = useMemo(() => {
    if (checkIn && checkOut) {
      const diff =
        fromDateKey(checkOut).getTime() - fromDateKey(checkIn).getTime();
      return Math.max(Math.ceil(diff / 86_400_000), 1);
    }
    if (
      pickingEnd &&
      hoveredDate &&
      hoveredDate > fromDateKey(checkIn) &&
      !isDateDisabled(hoveredDate, true)
    ) {
      const diff =
        hoveredDate.getTime() - fromDateKey(checkIn).getTime();
      return Math.max(Math.ceil(diff / 86_400_000), 1);
    }
    return 0;
  }, [checkIn, checkOut, pickingEnd, hoveredDate, isDateDisabled]);

  const previewEnd =
    pickingEnd &&
    hoveredDate &&
    hoveredDate > fromDateKey(checkIn) &&
    !isDateDisabled(hoveredDate, true)
      ? toDateKey(hoveredDate)
      : "";

  const rangeLabel =
    checkIn && checkOut
      ? `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)} (${currentNights} đêm)`
      : checkIn && previewEnd
        ? `${formatShortDate(checkIn)} – ${formatShortDate(previewEnd)} (${currentNights} đêm)`
        : checkIn
          ? `${formatShortDate(checkIn)} – Chọn ngày trả phòng`
          : "Chọn ngày nhận phòng";

  return (
    <div className="relative" ref={containerRef}>
      {/* Khung Trigger Nhận phòng / Trả phòng */}
      <div
        className={`grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 border-b border-gray-200 dark:border-white/10 cursor-pointer transition-colors ${
          isCalendarOpen
            ? "bg-rose-50/40 dark:bg-rose-950/20"
            : "hover:bg-gray-50/70 dark:hover:bg-slate-800/40"
        }`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!isCalendarOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!isCalendarOpen);
          }
        }}
      >
        <div className={`p-3 transition-colors ${!checkIn || !pickingEnd ? "ring-inset" : ""}`}>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center justify-between">
            <span>Nhận phòng</span>
            <i className="fa-solid fa-calendar-day text-[11px] text-rose-500" />
          </span>
          <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
            {checkIn ? formatDisplayDate(checkIn) : "Chọn ngày"}
          </p>
        </div>

        <div className={`p-3 transition-colors ${pickingEnd ? "ring-inset" : ""}`}>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center justify-between">
            <span>Trả phòng</span>
            <i className="fa-solid fa-calendar-check text-[11px] text-rose-500" />
          </span>
          <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
            {checkOut ? formatDisplayDate(checkOut) : "Chọn ngày"}
          </p>
        </div>
      </div>

      {/* POPUP LỊCH CHỌN NGÀY */}
      {isCalendarOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 sm:right-auto sm:w-[350px] md:w-[380px] lg:w-[410px] -translate-x-0 sm:left-1/2 sm:-translate-x-1/2">
          <div
            className={`${uiClassNames.popoverMotion} overflow-hidden rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-4 sm:p-5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10`}
          >
            {/* Header Hướng dẫn & Trạng thái */}
            <div className="mb-4 flex flex-col items-center gap-1.5 border-b border-gray-100 dark:border-white/10 pb-3.5">
              {!checkIn ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300 animate-pulse">
                  <i className="fa-solid fa-hand-pointer text-[11px]" />
                  Chọn ngày nhận phòng
                </span>
              ) : pickingEnd ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300 animate-pulse">
                  <i className="fa-solid fa-calendar-plus text-[11px]" />
                  Chọn ngày trả phòng (tối thiểu 1 đêm)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/20 px-3.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-300">
                  <i className="fa-solid fa-circle-check text-[11px]" />
                  {rangeLabel}
                </span>
              )}

              {/* Chú thích trạng thái lịch */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Đang chọn
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-600 line-through" />
                  Đã kín phòng
                </span>
              </div>
            </div>

            {/* Điều hướng Tháng & Lịch */}
            <div className="relative">
              <button
                aria-label="Tháng trước"
                className={`${uiClassNames.iconButton} absolute top-0 left-0 z-10 h-7 w-7 text-xs`}
                disabled={
                  visibleMonth.getTime() <= startOfMonth(new Date()).getTime()
                }
                type="button"
                onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button
                aria-label="Tháng sau"
                className={`${uiClassNames.iconButton} absolute top-0 right-0 z-10 h-7 w-7 text-xs`}
                type="button"
                onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>

              <CalendarMonth
                checkIn={checkIn}
                checkOut={checkOut}
                hoveredDate={hoveredDate}
                isDateDisabled={isDateDisabled}
                isDateOccupied={isDateOccupied}
                month={visibleMonth}
                pickingEnd={pickingEnd}
                onHover={setHoveredDate}
                onSelect={handleSelectDate}
              />
            </div>

            {/* Footer hành động */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-3 text-xs">
              <button
                className="font-semibold text-gray-500 dark:text-slate-400 underline hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                type="button"
                onClick={() => {
                  onSelectRange({ checkIn: "", checkOut: "" });
                  setHoveredDate(null);
                }}
              >
                Xóa ngày
              </button>
              <button
                className="rounded-lg bg-gray-900 dark:bg-white px-3.5 py-1.5 font-bold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                type="button"
                onClick={() => setOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDateSelector;
