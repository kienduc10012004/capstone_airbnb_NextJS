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
  month: Date;
  onSelect: (date: Date) => void;
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const CalendarMonth = ({
  checkIn,
  checkOut,
  month,
  onSelect,
}: CalendarMonthProps) => (
  <div className="min-w-0 flex-1">
    <h4 className="text-center text-sm font-semibold capitalize text-gray-900">
      {formatMonth(month)}
    </h4>
    <div className="mt-4 grid grid-cols-7 text-center">
      {weekDays.map((day) => (
        <span
          className="py-2 text-[11px] font-semibold text-gray-500"
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
        const selected = dateKey === checkIn || dateKey === checkOut;
        const inRange =
          Boolean(checkIn && checkOut) &&
          date > fromDateKey(checkIn) &&
          date < fromDateKey(checkOut);
        return (
          <button
            aria-label={date.toLocaleDateString("vi-VN")}
            className={`mx-auto my-0.5 grid h-10 w-10 place-items-center rounded-full text-sm ${
              selected
                ? "bg-gray-950 font-semibold text-white"
                : inRange
                  ? "bg-gray-100 text-gray-900"
                  : "hover:border hover:border-gray-900"
            } disabled:cursor-not-allowed disabled:text-gray-300`}
            disabled={disabled}
            key={dateKey}
            type="button"
            onClick={() => onSelect(date)}
          >
            {date.getDate()}
          </button>
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
    onComplete();
  };

  const valueLabel =
    value.checkIn && value.checkOut
      ? `${formatShortDate(value.checkIn)} – ${formatShortDate(value.checkOut)}`
      : value.checkIn
        ? `${formatShortDate(value.checkIn)} – Thêm ngày`
        : "Thêm ngày";

  const content = (
    <div className="p-5 sm:p-7">
      <div className="mx-auto mb-6 flex w-fit rounded-full bg-gray-100 p-1">
        <span className="rounded-full bg-white px-5 py-2 text-xs font-semibold shadow-sm">
          Chọn ngày
        </span>
        <span className="px-5 py-2 text-xs font-semibold text-gray-500">
          Ngày linh hoạt
        </span>
      </div>
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
            month={visibleMonth}
            onSelect={selectDate}
          />
          {variant === "desktop" && (
            <CalendarMonth
              checkIn={value.checkIn}
              checkOut={value.checkOut}
              month={addMonths(visibleMonth, 1)}
              onSelect={selectDate}
            />
          )}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <button
          className="text-sm font-semibold underline"
          type="button"
          onClick={() => onChange({ checkIn: "", checkOut: "" })}
        >
          Xóa ngày
        </button>
        <p className="text-sm font-medium text-gray-600">{valueLabel}</p>
      </div>
    </div>
  );

  if (variant === "mobile") {
    return (
      <section
        className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
          active ? "border-gray-200 shadow-lg" : "border-gray-200"
        }`}
      >
        <button
          className="flex w-full items-center justify-between px-5 py-5 text-left"
          type="button"
          onClick={onActivate}
        >
          <span className="text-sm font-semibold text-gray-500">Thời gian</span>
          <span className="text-sm font-semibold text-gray-900">
            {valueLabel}
          </span>
        </button>
        {active && <div className="border-t border-gray-100">{content}</div>}
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
        <span className="block text-xs font-semibold text-gray-900">
          Thời gian
        </span>
        <span className="mt-0.5 block truncate text-sm text-gray-500">
          {valueLabel}
        </span>
      </button>
      {active && (
        <div className="absolute top-[calc(100%+14px)] left-1/2 z-30 w-[min(780px,calc(100vw-32px))] -translate-x-1/2">
          <div
            className={`${uiClassNames.popoverMotion} overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl`}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
