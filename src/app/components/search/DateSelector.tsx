"use client";

import { useState } from "react";

import {
  addMonths,
  formatMonth,
  formatShortDate,
  fromDateKey,
  getCalendarDays,
  isBeforeToday,
  startOfMonth,
  toDateKey,
} from "@/app/components/search/date-utils";
import type {
  DateRange,
  SearchSelectorVariant,
} from "@/app/components/search/types";
import { uiClassNames } from "@/app/lib/styles";

type DateSelectorProps = {
  active: boolean;
  value: DateRange;
  variant: SearchSelectorVariant;
  onActivate: () => void;
  onChange: (value: DateRange) => void;
  onComplete: () => void;
};

type CalendarMonthProps = {
  checkIn: string;
  checkOut: string;
  hoveredDate: Date | null;
  month: Date;
  pickingEnd: boolean;
  onHover: (date: Date | null) => void;
  onSelect: (date: Date) => void;
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const CalendarMonth = ({
  checkIn,
  checkOut,
  hoveredDate,
  month,
  pickingEnd,
  onHover,
  onSelect,
}: CalendarMonthProps) => (
  <div className="min-w-0 flex-1">
    <h4 className="text-center text-sm font-semibold capitalize text-gray-900 dark:text-white">
      {formatMonth(month)}
    </h4>
    <div className="mt-4 grid grid-cols-7 text-center">
      {weekDays.map((day) => (
        <span
          className="py-2 text-[11px] font-semibold text-gray-400 dark:text-slate-400"
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
        const disabled = isBeforeToday(date);

        // Confirmed selection
        const isConfirmedStart = dateKey === checkIn;
        const isConfirmedEnd = dateKey === checkOut;

        const confirmedInRange =
          Boolean(checkIn && checkOut) &&
          date > fromDateKey(checkIn) &&
          date < fromDateKey(checkOut);

        // Hover preview (only when picking end date)
        const previewCheckOut =
          pickingEnd && hoveredDate && hoveredDate > fromDateKey(checkIn)
            ? hoveredDate
            : null;

        const isPreviewEnd =
          pickingEnd && previewCheckOut !== null && toDateKey(previewCheckOut) === dateKey;

        const inPreviewRange =
          Boolean(checkIn && previewCheckOut) &&
          date > fromDateKey(checkIn) &&
          date < previewCheckOut!;

        // Use preview range if hovering, else confirmed range
        const inRange = previewCheckOut ? inPreviewRange : confirmedInRange;
        const isStart = isConfirmedStart;
        const isEnd = previewCheckOut ? isPreviewEnd : isConfirmedEnd;
        const selected = isStart || isEnd;

        const hasRange = Boolean(
          previewCheckOut ? (checkIn && previewCheckOut) : (checkIn && checkOut)
        );
        const showRightHalf = hasRange && isStart;
        const showLeftHalf = hasRange && isEnd;

        return (
          <div
            key={dateKey}
            className={`relative my-0.5 flex h-10 items-center justify-center transition-colors duration-100 ${
              inRange
                ? "bg-rose-100 dark:bg-rose-950/60"
                : showRightHalf
                  ? "bg-gradient-to-r from-transparent to-rose-100 dark:to-rose-950/60"
                  : showLeftHalf
                    ? "bg-gradient-to-l from-transparent to-rose-100 dark:to-rose-950/60"
                    : ""
            }`}
          >
            <button
              aria-label={date.toLocaleDateString("vi-VN")}
              className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-medium transition-all duration-150 ${
                selected
                  ? "bg-rose-500 font-semibold text-white shadow-md shadow-rose-500/30 scale-105"
                  : inRange
                    ? "text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60"
                    : disabled
                      ? "cursor-not-allowed text-gray-300 dark:text-slate-600"
                      : "text-gray-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border hover:border-rose-300 dark:hover:border-rose-500/40"
              }`}
              disabled={disabled}
              type="button"
              onClick={() => onSelect(date)}
              onMouseEnter={() => onHover(date)}
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

const DateSelector = ({
  active,
  onActivate,
  onChange,
  onComplete,
  value,
  variant,
}: DateSelectorProps) => {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // pickingEnd = đã chọn checkIn, chưa chọn checkOut
  const pickingEnd = Boolean(value.checkIn && !value.checkOut);

  const selectDate = (date: Date) => {
    const dateKey = toDateKey(date);
    if (!value.checkIn || value.checkOut) {
      onChange({ checkIn: dateKey, checkOut: "" });
      return;
    }
    if (date <= fromDateKey(value.checkIn)) {
      onChange({ checkIn: dateKey, checkOut: "" });
      return;
    }
    onChange({ ...value, checkOut: dateKey });
    setHoveredDate(null);
    onComplete();
  };

  // Label dùng preview nếu đang hover
  const previewEnd =
    pickingEnd && hoveredDate && hoveredDate > fromDateKey(value.checkIn)
      ? toDateKey(hoveredDate)
      : "";

  const valueLabel =
    value.checkIn && value.checkOut
      ? `${formatShortDate(value.checkIn)} – ${formatShortDate(value.checkOut)}`
      : value.checkIn && previewEnd
        ? `${formatShortDate(value.checkIn)} – ${formatShortDate(previewEnd)}`
        : value.checkIn
          ? `${formatShortDate(value.checkIn)} – Thêm ngày`
          : "Thêm ngày";

  const content = (
    <div className="p-5 sm:p-7">
      {/* 2 thông báo theo từng bước: Ban đầu là 'Chọn ngày bắt đầu', sau khi bấm chọn mới hiện 'Di chuột để xem, nhấn để chọn ngày trả phòng' */}
      {!value.checkIn ? (
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-4 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300 animate-pulse">
            <i aria-hidden="true" className="fa-solid fa-hand-pointer" />
            Chọn ngày bắt đầu
          </span>
        </div>
      ) : pickingEnd ? (
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-4 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300 animate-pulse">
            <i aria-hidden="true" className="fa-solid fa-hand-pointer" />
            Di chuột để xem, nhấn để chọn ngày trả phòng
          </span>
        </div>
      ) : (
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-4 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
            <i aria-hidden="true" className="fa-solid fa-calendar-days" />
            {valueLabel}
          </span>
        </div>
      )}

      <div className="relative">
        <button
          aria-label="Tháng trước"
          className={`${uiClassNames.iconButton} absolute top-0 left-0 z-10 h-8 w-8 text-sm`}
          disabled={
            visibleMonth.getTime() <= startOfMonth(new Date()).getTime()
          }
          type="button"
          onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
        >
          <i aria-hidden="true" className="fa-solid fa-chevron-left" />
        </button>
        <button
          aria-label="Tháng sau"
          className={`${uiClassNames.iconButton} absolute top-0 right-0 z-10 h-8 w-8 text-sm`}
          type="button"
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
        >
          <i aria-hidden="true" className="fa-solid fa-chevron-right" />
        </button>
        <div className="flex gap-10">
          <CalendarMonth
            checkIn={value.checkIn}
            checkOut={value.checkOut}
            hoveredDate={hoveredDate}
            month={visibleMonth}
            pickingEnd={pickingEnd}
            onHover={setHoveredDate}
            onSelect={selectDate}
          />
          {variant === "desktop" && (
            <CalendarMonth
              checkIn={value.checkIn}
              checkOut={value.checkOut}
              hoveredDate={hoveredDate}
              month={addMonths(visibleMonth, 1)}
              pickingEnd={pickingEnd}
              onHover={setHoveredDate}
              onSelect={selectDate}
            />
          )}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-4">
        <button
          className="text-sm font-semibold text-gray-500 dark:text-slate-400 underline hover:text-gray-900 dark:hover:text-white transition-colors"
          type="button"
          onClick={() => {
            onChange({ checkIn: "", checkOut: "" });
            setHoveredDate(null);
          }}
        >
          Xóa ngày
        </button>
        <p className={`text-sm font-medium transition-colors duration-150 ${previewEnd ? "text-rose-400" : "text-rose-500 dark:text-rose-400"}`}>
          {valueLabel}
        </p>
      </div>
    </div>
  );

  if (variant === "mobile") {
    return (
      <section
        className={`overflow-hidden rounded-2xl border bg-white dark:bg-[#1a2236] shadow-sm ${
          active ? "border-gray-200 dark:border-white/10 shadow-lg" : "border-gray-200 dark:border-white/10"
        }`}
      >
        <button
          className="flex w-full items-center justify-between px-5 py-5 text-left"
          type="button"
          onClick={onActivate}
        >
          <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">Thời gian</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {valueLabel}
          </span>
        </button>
        {active && <div className="border-t border-gray-100 dark:border-white/10">{content}</div>}
      </section>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <button
        className={`search-segment relative z-10 w-full rounded-full px-6 py-3.5 text-left transition-colors duration-200 ${
          active
            ? "bg-rose-50 dark:bg-white/[0.06]"
            : "hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
        }`}
        type="button"
        onClick={onActivate}
      >
        <span className="block text-xs font-semibold text-gray-900 dark:text-white">
          Thời gian
        </span>
        <span className="mt-0.5 block truncate text-sm text-gray-500 dark:text-slate-400">
          {valueLabel}
        </span>
      </button>
      {active && (
        <div className="absolute top-[calc(100%+14px)] left-1/2 z-30 w-[min(780px,calc(100vw-32px))] -translate-x-1/2">
          <div
            className={`${uiClassNames.popoverMotion} overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2236] shadow-2xl`}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
