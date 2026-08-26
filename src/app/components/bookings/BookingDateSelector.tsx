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
  activeField: "checkIn" | "checkOut";
  checkIn: string;
  checkOut: string;
  isDateDisabled: (date: Date, field: "checkIn" | "checkOut") => boolean;
  isDateOccupied: (date: Date) => boolean;
  month: Date;
  onSelect: (date: Date) => void;
};

const CalendarMonth = ({
  activeField,
  checkIn,
  checkOut,
  isDateDisabled,
  isDateOccupied,
  month,
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
        const disabled = isDateDisabled(date, activeField);
        const occupied = isDateOccupied(date);

        const isCheckIn = dateKey === checkIn;
        const isCheckOut = dateKey === checkOut;

        return (
          <div
            className="relative my-0.5 flex h-9 items-center justify-center"
            key={dateKey}
          >
            <button
              aria-label={`${date.toLocaleDateString("vi-VN")}${
                isCheckIn
                  ? " - Ngày nhận phòng"
                  : isCheckOut
                    ? " - Ngày trả phòng"
                    : occupied
                      ? " - Đã có khách đặt"
                      : ""
              }`}
              className={`relative z-10 grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                isCheckIn
                  ? "bg-rose-500 font-bold text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-300 dark:ring-rose-500 scale-105"
                  : isCheckOut
                    ? "bg-rose-600 font-bold text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-300 dark:ring-rose-500 scale-105"
                    : occupied
                      ? "cursor-not-allowed text-gray-400/80 dark:text-slate-500 line-through bg-gray-100/60 dark:bg-slate-800/40"
                      : disabled
                        ? "cursor-not-allowed text-gray-300 dark:text-slate-600"
                        : "text-gray-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 cursor-pointer"
              }`}
              disabled={disabled}
              title={
                isCheckIn
                  ? `Ngày nhận phòng: ${formatDisplayDate(dateKey)}`
                  : isCheckOut
                    ? `Ngày trả phòng: ${formatDisplayDate(dateKey)}`
                    : occupied
                      ? "Phòng đã có khách đặt ngày này"
                      : disabled
                        ? "Ngày không khả dụng"
                        : `Chọn ngày ${formatDisplayDate(dateKey)}`
              }
              type="button"
              onClick={() => onSelect(date)}
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

  const [activeField, setActiveField] = useState<"checkIn" | "checkOut">("checkIn");

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(checkIn ? fromDateKey(checkIn) : new Date()),
  );

  const setOpen = useCallback(
    (open: boolean) => {
      setInternalIsOpen(open);
      onOpenChange?.(open);
      if (!open) {
        onClose?.();
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

  // Kiểm tra ngày có bị vô hiệu hóa (disabled) không theo từng tab đang chọn
  const isDateDisabled = useCallback(
    (date: Date, field: "checkIn" | "checkOut"): boolean => {
      if (isBeforeToday(date)) return true;

      const key = toDateKey(date);

      if (field === "checkOut") {
        if (checkIn) {
          // Ngày trả phòng phải sau ngày nhận ít nhất 1 đêm
          if (key <= checkIn) return true;

          // Không cho phép chọn ngày trả phòng nhảy qua khoảng đã có khách đặt
          if (nextBlockedCheckIn && key > nextBlockedCheckIn) return true;

          return false;
        }
        return isDateOccupied(date);
      }

      // Khi chọn ngày nhận phòng: các ngày đã kín phòng thì disable
      return isDateOccupied(date);
    },
    [checkIn, isDateOccupied, nextBlockedCheckIn],
  );

  // Chọn ngày độc lập cho từng trường
  const handleSelectDate = (date: Date) => {
    const dateKey = toDateKey(date);

    if (activeField === "checkIn") {
      // Khi chọn ngày nhận:
      if (checkOut) {
        // Nếu ngày nhận mới >= ngày trả cũ, hoặc khoảng mới bị vướng lịch kín -> reset ngày trả và chuyển sang chọn ngày trả
        if (dateKey >= checkOut) {
          onSelectRange({ checkIn: dateKey, checkOut: "" });
          setActiveField("checkOut");
          return;
        }

        const nextBlock = roomBookings.find((b) => b.checkIn > dateKey)?.checkIn;
        if (nextBlock && checkOut > nextBlock) {
          onSelectRange({ checkIn: dateKey, checkOut: "" });
          setActiveField("checkOut");
          return;
        }

        // Ngày nhận mới hợp lệ với ngày trả cũ -> cập nhật ngày nhận, giữ nguyên ngày trả
        onSelectRange({ checkIn: dateKey, checkOut });
      } else {
        // Chưa có ngày trả -> gán ngày nhận và chuyển sang chọn ngày trả
        onSelectRange({ checkIn: dateKey, checkOut: "" });
        setActiveField("checkOut");
      }
    } else {
      // Khi chọn ngày trả:
      if (!checkIn) {
        // Nếu chưa có ngày nhận -> đặt làm ngày nhận trước
        onSelectRange({ checkIn: dateKey, checkOut: "" });
        setActiveField("checkOut");
        return;
      }

      if (dateKey <= checkIn) {
        // Ngày trả <= ngày nhận -> chuyển thành ngày nhận mới
        onSelectRange({ checkIn: dateKey, checkOut: "" });
        setActiveField("checkOut");
        return;
      }

      if (nextBlockedCheckIn && dateKey > nextBlockedCheckIn) {
        // Vướng lịch kín
        return;
      }

      // Cập nhật ngày trả độc lập, giữ nguyên ngày nhận
      onSelectRange({ checkIn, checkOut: dateKey });
      setOpen(false);
    }
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

  // Số đêm đang chọn
  const currentNights = useMemo(() => {
    if (checkIn && checkOut && checkIn < checkOut) {
      const diff =
        fromDateKey(checkOut).getTime() - fromDateKey(checkIn).getTime();
      return Math.max(Math.ceil(diff / 86_400_000), 1);
    }
    return 0;
  }, [checkIn, checkOut]);

  const handleOpenField = (field: "checkIn" | "checkOut") => {
    setActiveField(field);
    const targetDate = field === "checkIn" ? checkIn : checkOut || checkIn;
    if (targetDate) {
      setVisibleMonth(startOfMonth(fromDateKey(targetDate)));
    }
    if (!isCalendarOpen) {
      setOpen(true);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Khung Trigger Nhận phòng / Trả phòng (2 ô độc lập) */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 border-b border-gray-200 dark:border-white/10 rounded-t-2xl">
        <button
          type="button"
          onClick={() => handleOpenField("checkIn")}
          className={`p-3 rounded-tl-2xl text-left transition-all cursor-pointer ${
            isCalendarOpen && activeField === "checkIn"
              ? "bg-rose-50 dark:bg-rose-950/40 ring-2 ring-inset ring-rose-500"
              : "hover:bg-gray-50/70 dark:hover:bg-slate-800/40"
          }`}
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center justify-between">
            <span>Nhận phòng</span>
            <i
              className={`fa-solid fa-calendar-day text-[11px] ${
                isCalendarOpen && activeField === "checkIn"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-rose-500"
              }`}
            />
          </span>
          <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
            {checkIn ? formatDisplayDate(checkIn) : "Chọn ngày"}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleOpenField("checkOut")}
          className={`p-3 rounded-tr-2xl text-left transition-all cursor-pointer ${
            isCalendarOpen && activeField === "checkOut"
              ? "bg-rose-50 dark:bg-rose-950/40 ring-2 ring-inset ring-rose-500"
              : "hover:bg-gray-50/70 dark:hover:bg-slate-800/40"
          }`}
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center justify-between">
            <span>Trả phòng</span>
            <i
              className={`fa-solid fa-calendar-check text-[11px] ${
                isCalendarOpen && activeField === "checkOut"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-rose-500"
              }`}
            />
          </span>
          <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
            {checkOut ? formatDisplayDate(checkOut) : "Chọn ngày"}
          </p>
        </button>
      </div>

      {/* POPUP LỊCH CHỌN NGÀY */}
      {isCalendarOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] w-full min-w-[310px] sm:min-w-[350px] md:min-w-[380px] lg:w-[410px] sm:left-1/2 sm:-translate-x-1/2">
          <div
            className={`${uiClassNames.popoverMotion} overflow-hidden rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-4 sm:p-5 shadow-2xl ring-1 ring-black/10 dark:ring-white/10`}
          >
            {/* Header Tabs chuyển đổi Nhận phòng / Trả phòng trong popup */}
            <div className="mb-4 space-y-2.5 border-b border-gray-100 dark:border-white/10 pb-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/90 dark:bg-slate-800/90 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveField("checkIn");
                    if (checkIn) setVisibleMonth(startOfMonth(fromDateKey(checkIn)));
                  }}
                  className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeField === "checkIn"
                      ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs ring-2 ring-rose-500"
                      : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Nhận phòng
                  </span>
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {checkIn ? formatDisplayDate(checkIn) : "Chọn ngày"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveField("checkOut");
                    if (checkOut) setVisibleMonth(startOfMonth(fromDateKey(checkOut)));
                  }}
                  className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeField === "checkOut"
                      ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs ring-2 ring-rose-500"
                      : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    Trả phòng
                  </span>
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {checkOut ? formatDisplayDate(checkOut) : "Chọn ngày"}
                  </span>
                </button>
              </div>

              {/* Status Message & Tổng số đêm */}
              <div className="flex flex-col items-center gap-1">
                {activeField === "checkIn" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
                    <i className="fa-solid fa-hand-pointer text-[11px]" />
                    Chọn ngày nhận phòng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
                    <i className="fa-solid fa-calendar-check text-[11px]" />
                    Chọn ngày trả phòng (sau ngày nhận)
                  </span>
                )}

                {checkIn && checkOut && currentNights > 0 && (
                  <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300">
                    {currentNights} đêm ({formatShortDate(checkIn)} → {formatShortDate(checkOut)})
                  </span>
                )}
              </div>

              {/* Chú thích trạng thái lịch */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Nhận phòng
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  Trả phòng
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-600 line-through" />
                  Đã kín
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
                activeField={activeField}
                checkIn={checkIn}
                checkOut={checkOut}
                isDateDisabled={isDateDisabled}
                isDateOccupied={isDateOccupied}
                month={visibleMonth}
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
                  setActiveField("checkIn");
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
