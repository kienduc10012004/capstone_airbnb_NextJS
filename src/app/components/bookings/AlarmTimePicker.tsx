"use client";

import { useEffect, useRef, useState } from "react";

type AlarmTimePickerProps = {
  value: string; // HH:mm format, e.g. "08:00"
  onChange: (time: string) => void;
};

const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutesList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const presets = [
  { label: "Sáng sớm", time: "07:00" },
  { label: "Buổi sáng", time: "08:00" },
  { label: "Buổi trưa", time: "12:00" },
  { label: "Tiêu chuẩn", time: "14:00" },
  { label: "Buổi chiều", time: "16:00" },
  { label: "Buổi tối", time: "18:00" },
];

const AlarmTimePicker = ({ value, onChange }: AlarmTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [selectedHour, setSelectedHour] = useState(() => value.split(":")[0] || "08");
  const [selectedMinute, setSelectedMinute] = useState(() => value.split(":")[1] || "00");

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [h, m] = value.split(":");
    if (h) setSelectedHour(h);
    if (m) setSelectedMinute(m);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Scroll active item into center view when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const hourElem = hourScrollRef.current?.querySelector<HTMLElement>(`[data-hour="${selectedHour}"]`);
        if (hourElem && hourScrollRef.current) {
          hourScrollRef.current.scrollTop = hourElem.offsetTop - hourScrollRef.current.offsetHeight / 2 + hourElem.offsetHeight / 2;
        }
        const minuteElem = minuteScrollRef.current?.querySelector<HTMLElement>(`[data-minute="${selectedMinute}"]`);
        if (minuteElem && minuteScrollRef.current) {
          minuteScrollRef.current.scrollTop = minuteElem.offsetTop - minuteScrollRef.current.offsetHeight / 2 + minuteElem.offsetHeight / 2;
        }
      }, 50);
    }
  }, [open, selectedHour, selectedMinute]);

  const handleHourSelect = (h: string) => {
    setSelectedHour(h);
    onChange(`${h}:${selectedMinute}`);
  };

  const handleMinuteSelect = (m: string) => {
    setSelectedMinute(m);
    onChange(`${selectedHour}:${m}`);
  };

  const handlePreset = (time: string) => {
    const [h, m] = time.split(":");
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(time);
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger button */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-300 shadow-sm transition-all hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:scale-[1.02] active:scale-[0.98]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <i aria-hidden="true" className="fa-regular fa-clock text-rose-500" />
        <span>{value}</span>
        <i aria-hidden="true" className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Alarm style Popover Wheel */}
      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-72 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#1a2236] p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-bell text-rose-500" />
              Chọn giờ & phút nhận phòng
            </span>
            <button
              type="button"
              className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          {/* Wheel Selector with Alarm Clock Style */}
          <div className="mt-3 relative flex items-center justify-center gap-3 bg-gray-50 dark:bg-slate-900/60 rounded-xl p-2 border border-gray-200/80 dark:border-white/10">
            {/* Center Selection Bar Overlay */}
            <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30" />

            {/* Hours Column */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-400 mb-1">Giờ</span>
              <div
                ref={hourScrollRef}
                className="h-36 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 text-center py-12 space-y-1 snap-y snap-mandatory"
              >
                {hoursList.map((h) => {
                  const isSelected = h === selectedHour;
                  return (
                    <button
                      key={h}
                      data-hour={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`block w-full py-1 text-sm font-bold transition-all rounded-md snap-center ${
                        isSelected
                          ? "text-rose-600 dark:text-rose-400 font-extrabold text-base scale-110"
                          : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colon Divider */}
            <span className="text-xl font-extrabold text-rose-500 pb-2">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-400 mb-1">Phút</span>
              <div
                ref={minuteScrollRef}
                className="h-36 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 text-center py-12 space-y-1 snap-y snap-mandatory"
              >
                {minutesList.map((m) => {
                  const isSelected = m === selectedMinute;
                  return (
                    <button
                      key={m}
                      data-minute={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`block w-full py-1 text-sm font-bold transition-all rounded-md snap-center ${
                        isSelected
                          ? "text-rose-600 dark:text-rose-400 font-extrabold text-base scale-110"
                          : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-3">
            <span className="block text-[10px] font-bold uppercase text-gray-400 dark:text-slate-400 mb-1.5">
              Gợi ý giờ phổ biến:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => handlePreset(preset.time)}
                  className={`rounded-lg py-1 px-1.5 text-[11px] font-semibold border transition-all ${
                    value === preset.time
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                      : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300"
                  }`}
                >
                  {preset.time}
                </button>
              ))}
            </div>
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
          >
            Hoàn tất ({selectedHour}:{selectedMinute})
          </button>
        </div>
      )}
    </div>
  );
};

export default AlarmTimePicker;
