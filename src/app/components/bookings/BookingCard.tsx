"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import StatusMessage from "@/app/components/ui/StatusMessage";
import { createBooking, getApiErrorMessage, getBookings } from "@/app/lib/api";
import { OPEN_SIGN_IN_EVENT } from "@/app/lib/auth-events";
import {
  getStayDateRange,
  hasBookingConflict,
} from "@/app/lib/booking-availability";
import { formatDateForInput } from "@/app/lib/date";
import { bookingSchema, type BookingFormData } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

type BookingCardProps = {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  maxGuests: number;
  price: number;
  rating?: number | null;
  reviewCount?: number;
  roomId: number;
};

// Full 24 khung giờ từ 00:00 đến 23:00
const fullHoursList = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return `${h}:00`;
});

const getDefaultDates = (checkIn?: string, checkOut?: string) => {
  if (checkIn && checkOut) {
    return { ngayDen: checkIn, ngayDi: checkOut };
  }
  const arrival = new Date();
  arrival.setDate(arrival.getDate() + 1);
  const departure = new Date(arrival);
  departure.setDate(departure.getDate() + 1);
  return {
    ngayDen: formatDateForInput(arrival),
    ngayDi: formatDateForInput(departure),
  };
};

const BookingCard = ({
  initialCheckIn,
  initialCheckOut,
  initialGuests = 1,
  maxGuests,
  price,
  rating = null,
  reviewCount = 0,
  roomId,
}: BookingCardProps) => {
  const defaults = useMemo(
    () => getDefaultDates(initialCheckIn, initialCheckOut),
    [initialCheckIn, initialCheckOut],
  );
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Khung giờ 24h & Gói hình thức lưu trú (Theo Đêm vs Trọn Ngày)
  const [checkInTime, setCheckInTime] = useState("07:00");
  const [stayPackage, setStayPackage] = useState<"overnight" | "full_day">(
    "full_day",
  );

  // State collapsible quy định trả phòng
  const [showPolicyAccordion, setShowPolicyAccordion] = useState(false);

  // State popup xác nhận
  const [pendingFormData, setPendingFormData] =
    useState<BookingFormData | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      ...defaults,
      soLuongKhach: Math.min(Math.max(initialGuests, 1), maxGuests),
    },
  });

  const [arrival, departure, selectedGuests] = useWatch({
    control,
    name: ["ngayDen", "ngayDi", "soLuongKhach"],
  });

  const billableGuests = Math.max(Number(selectedGuests) || 1, 1);
  const rawNights = Math.max(
    Math.ceil(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
        86_400_000,
    ) || 0,
    1,
  );

  // TÍNH TOÁN GIỜ TRẢ PHÒNG VÀ HẠN TRỄ TỰ ĐỘNG
  // - Nếu chọn "Trọn Ngày": Giờ trả = Giờ nhận phòng (VD: 07:00 -> 07:00)
  // - Nếu chọn "Theo Đêm": Giờ trả = 12:00
  const calculatedCheckOutTime =
    stayPackage === "full_day" ? checkInTime : "12:00";

  // TÍNH HẠN CHÓT TRỄ (Ân hạn 3 tiếng, tối đa 10:00 sáng cho gói trọn ngày)
  const checkInHour = parseInt(checkInTime.split(":")[0], 10);
  const checkOutHour = parseInt(calculatedCheckOutTime.split(":")[0], 10);

  // Hạn trễ trọn ngày tối đa 10:00 (hoặc checkOutHour + 3)
  const graceHour = Math.min((checkOutHour + 3) % 24, 23);
  const graceTimeStr =
    stayPackage === "full_day" && checkInHour <= 7
      ? "10:00"
      : `${String(graceHour).padStart(2, "0")}:00`;

  // Phạt trễ giờ: 10% tiền phòng / 1 tiếng trễ
  const penaltyPerLateHour = Math.round(price * 0.1);

  // Tính số đêm/ngày lưu trú & Tổng chi phí
  const effectiveDaysCount = rawNights + 1; // Số ngày (VD: Ngày 1 đến 3 = 3 ngày)
  const effectiveNights =
    stayPackage === "full_day" ? rawNights + 1 : rawNights;

  const staySubtotal = price * effectiveNights * billableGuests;
  const serviceFee = staySubtotal > 0 ? Math.round(staySubtotal * 0.12) : 0;
  const total = staySubtotal + serviceFee;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  //==== BƯỚC 1: Validate thông tin, nếu hợp lệ sẽ mở POPUP XÁC NHẬN ====
  const handlePreSubmit = async (values: BookingFormData) => {
    setMessage(null);
    if (!user) {
      window.dispatchEvent(new CustomEvent(OPEN_SIGN_IN_EVENT));
      setMessage({
        text: "Vui lòng đăng nhập để tiến hành đặt phòng.",
        type: "error",
      });
      return;
    }

    try {
      const requestedRange = getStayDateRange(values.ngayDen, values.ngayDi);
      if (!requestedRange) {
        setMessage({
          text: "Ngày nhận và ngày trả phòng không hợp lệ.",
          type: "error",
        });
        return;
      }

      const bookingsResponse = await getBookings();
      if (
        hasBookingConflict(bookingsResponse.content, roomId, requestedRange)
      ) {
        setMessage({
          text: "Phòng đã có người đặt trong khoảng ngày này. Vui lòng chọn ngày khác.",
          type: "error",
        });
        return;
      }

      // Hợp lệ -> mở Popup xác nhận
      setPendingFormData(values);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể kiểm tra lịch phòng."),
        type: "error",
      });
    }
  };

  //==== BƯỚC 2: Thực hiện ĐẶT PHÒNG chính thức khi bấm nút trong Popup ====
  const executeBooking = async () => {
    if (!pendingFormData || !user) return;

    setBookingLoading(true);
    try {
      const startIso = new Date(
        `${pendingFormData.ngayDen}T${checkInTime}:00`,
      ).toISOString();
      const endIso = new Date(
        `${pendingFormData.ngayDi}T${calculatedCheckOutTime}:00`,
      ).toISOString();

      await createBooking({
        id: 0,
        maNguoiDung: user.id,
        maPhong: roomId,
        ngayDen: startIso,
        ngayDi: endIso,
        soLuongKhach: pendingFormData.soLuongKhach,
      });

      setPendingFormData(null);
      setMessage(null);
      showToast("Đặt phòng thành công!", "success");
      setMobileOpen(false);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể đặt phòng."),
        type: "error",
      });
      setPendingFormData(null);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Đóng bảng đặt phòng"
          className="fixed inset-0 z-[90] bg-gray-950/45 backdrop-blur-[1px] transition-opacity duration-300 starting:opacity-0 lg:hidden"
          type="button"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`${uiClassNames.surface} ${
          mobileOpen
            ? "fixed inset-x-0 bottom-0 z-[100] max-h-[88vh] overflow-y-auto rounded-b-none p-5 transition-transform duration-300 ease-out starting:translate-y-full"
            : "hidden"
        } lg:sticky lg:top-24 lg:block lg:self-start lg:p-6`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 lg:hidden">
          <h2 className="font-semibold text-gray-900">Đặt phòng</h2>
          <button
            aria-label="Đóng"
            className={`${uiClassNames.iconButton} h-9 w-9 text-xl`}
            type="button"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="flex items-baseline justify-between">
          <p>
            <span className="text-2xl font-semibold">${price}</span>
            <span className="text-sm text-gray-500"> / khách / đêm</span>
          </p>
          <span className="text-sm font-medium text-gray-700">
            {rating
              ? `★ ${rating.toFixed(1)} · ${reviewCount}`
              : "Chưa có đánh giá"}
          </span>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit(handlePreSubmit)}>
          {message && (
            <StatusMessage message={message.text} type={message.type} />
          )}

          {/* Chọn Gói Hình Thức Lưu Trú */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
              Hình thức lưu trú
            </label>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                className={`rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  stayPackage === "full_day"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={() => setStayPackage("full_day")}
              >
                ☀️ Trọn Ngày ({effectiveDaysCount} Ngày)
              </button>
              <button
                type="button"
                className={`rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  stayPackage === "overnight"
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={() => setStayPackage("overnight")}
              >
                🌙 Theo Đêm ({effectiveDaysCount}N {rawNights}Đ)
              </button>
            </div>
          </div>

          {/* Khung tách Nhận phòng & Trả phòng ra 2 hàng rộng rãi */}
          <div className="overflow-hidden rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900/40">
            {/* Hàng 1: NHẬN PHÒNG */}
            <div className="p-3 border-b border-gray-200 dark:border-white/10">
              <span className="block text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                <i className="fa-solid fa-clock mr-1" />
                Nhận phòng
              </span>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 px-2.5 py-1 border border-rose-200/80 dark:border-rose-500/30">
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-bold uppercase">Giờ:</span>
                  <select
                    className="bg-transparent text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-300 outline-none cursor-pointer"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  >
                    {fullHoursList.map((hour) => (
                      <option key={`in-${hour}`} value={hour} className="dark:bg-slate-800 text-gray-900 dark:text-white">
                        {hour}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase">Ngày:</span>
                  <input
                    className="bg-transparent text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none cursor-pointer [color-scheme:light_dark]"
                    min={formatDateForInput(new Date())}
                    type="date"
                    {...register("ngayDen")}
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: TRẢ PHÒNG (TỰ ĐỘNG) */}
            <div className="p-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-slate-800/40">
              <span className="block text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                <i className="fa-solid fa-calculator mr-1" />
                Trả phòng (Tự động)
              </span>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 border border-amber-200/80 dark:border-amber-500/30">
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">Giờ:</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-300">
                    {calculatedCheckOutTime}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase">Ngày:</span>
                  <input
                    className="bg-transparent text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none cursor-pointer [color-scheme:light_dark]"
                    min={arrival}
                    type="date"
                    {...register("ngayDi")}
                  />
                </div>
              </div>
            </div>

            <label className="block p-3">
              <span className="block text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
                Số khách
              </span>
              <select
                className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none cursor-pointer"
                {...register("soLuongKhach", { valueAsNumber: true })}
              >
                {Array.from({ length: Math.max(maxGuests, 1) }, (_, index) => (
                  <option key={index + 1} value={index + 1} className="dark:bg-slate-800 text-gray-900 dark:text-white">
                    {index + 1} khách
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Quy định trả phòng Accordion (Cho phép ẩn đi / sổ dọc xuống) */}
          <div className="overflow-hidden rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
            <button
              type="button"
              className="flex w-full items-center justify-between p-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
              onClick={() => setShowPolicyAccordion((prev) => !prev)}
            >
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info text-amber-600 dark:text-amber-400" />
                <span>Quy định giờ trả phòng & Phí phạt trễ</span>
              </span>
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${showPolicyAccordion ? "rotate-180" : ""}`} />
            </button>

            {showPolicyAccordion && (
              <div className="border-t border-amber-200/60 dark:border-amber-500/20 p-3 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200/90 space-y-1.5 bg-amber-50/80 dark:bg-amber-950/40">
                <p>
                  • Giờ trả phòng tự động: <strong className="text-amber-950 dark:text-amber-100">{calculatedCheckOutTime}</strong>.
                </p>
                <p>
                  • <strong>Ân hạn miễn phí:</strong> Cho phép trả trễ tối đa đến <strong className="text-emerald-700 dark:text-emerald-300">{graceTimeStr}</strong> (trễ 3 tiếng / tối đa 10:00).
                </p>
                <p>
                  • <strong>Phí trễ quá mốc:</strong> Trả phòng sau {graceTimeStr} sẽ bị phạt <strong className="text-rose-700 dark:text-rose-300">10% tiền phòng/đêm (${penaltyPerLateHour}/giờ)</strong>.
                </p>
              </div>
            )}
          </div>

          {(errors.ngayDen || errors.ngayDi || errors.soLuongKhach) && (
            <p className="text-xs text-red-500">
              {errors.ngayDen?.message ||
                errors.ngayDi?.message ||
                errors.soLuongKhach?.message}
            </p>
          )}

          <Button className="w-full" type="submit" variant="create">
            Xác nhận đặt phòng
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Bạn chưa bị trừ tiền ở bước này
        </p>
        {/* Chi tiết tính toán chi phí được thiết kế nổi bật & rõ ràng */}
        <div className="mt-5 space-y-3 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 p-4 border border-gray-200/80 dark:border-white/10 text-sm">
          <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
            <span>
              ${price} × {effectiveNights} {stayPackage === "full_day" ? "ngày" : "đêm"} × {billableGuests} khách
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">${staySubtotal}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
            <span>Phí dịch vụ hệ thống (12%)</span>
            <span className="font-semibold text-gray-900 dark:text-white">${serviceFee}</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-3 font-bold text-base">
            <span className="text-gray-900 dark:text-white">Tổng tạm tính</span>
            <span className="text-rose-600 dark:text-rose-400 text-lg font-extrabold">${total}</span>
          </div>
        </div>
      </aside>

      {!mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur-lg lg:hidden">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              ${price}{" "}
              <span className="text-sm font-normal text-gray-500">
                / khách / đêm
              </span>
            </p>
            {rating ? (
              <p className="text-xs text-gray-600">
                ★ {rating.toFixed(1)} · {reviewCount} đánh giá
              </p>
            ) : (
              <p className="text-xs text-gray-500">Chưa có đánh giá</p>
            )}
          </div>
          <Button
            className="min-w-32"
            variant="create"
            onClick={() => setMobileOpen(true)}
          >
            Đặt phòng
          </Button>
        </div>
      )}

      {/* POPUP XÁC NHẬN ĐẶT PHÒNG CHI TIẾT & CẢNH BÁO PHẠT 10% SAU 10H / ÂN HẠN TRỄ */}
      <Modal
        open={Boolean(pendingFormData)}
        title="Xác nhận chi tiết chuyến đi"
        onClose={() => setPendingFormData(null)}
      >
        {pendingFormData && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-rose-50/70 border border-rose-200 p-4 text-rose-950">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
                <i className="fa-solid fa-house-chimney text-base" />
                <span>Thông tin chuyến đi & Hình thức lưu trú</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Vui lòng kiểm tra kỹ ngày/giờ trả phòng tự động và quy định phạt trễ giờ trước khi xác nhận.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-200 p-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <span className="text-gray-500">
                  <i className="fa-solid fa-layer-group text-purple-500 mr-2" />
                  Gói lưu trú chọn
                </span>
                <span className="font-bold text-gray-900">
                  {stayPackage === "full_day"
                    ? `☀️ Trọn Ngày (${effectiveDaysCount} Ngày)`
                    : `🌙 Theo Đêm (${effectiveDaysCount} Ngày ${rawNights} Đêm)`}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <span className="text-gray-500">
                  <i className="fa-solid fa-calendar-plus text-rose-500 mr-2" />
                  Nhận phòng
                </span>
                <span className="font-semibold text-gray-900">
                  {new Date(pendingFormData.ngayDen).toLocaleDateString("vi-VN")} lúc{" "}
                  <span className="text-rose-600 font-bold">{checkInTime}</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <span className="text-gray-500">
                  <i className="fa-solid fa-calendar-minus text-amber-500 mr-2" />
                  Trả phòng tự động
                </span>
                <span className="font-semibold text-gray-900">
                  {new Date(pendingFormData.ngayDi).toLocaleDateString("vi-VN")} lúc{" "}
                  <span className="text-amber-600 font-bold">{calculatedCheckOutTime}</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <span className="text-gray-500">
                  <i className="fa-solid fa-clock text-emerald-600 mr-2" />
                  Hạn chót trễ (Miễn phí)
                </span>
                <span className="font-bold text-emerald-600">
                  Tối đa đến {graceTimeStr}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <span className="text-gray-500">
                  <i className="fa-solid fa-users text-blue-500 mr-2" />
                  Số lượng khách
                </span>
                <span className="font-semibold text-gray-900">
                  {pendingFormData.soLuongKhach} khách
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 font-bold text-base text-gray-900">
                <span>Tổng chi phí</span>
                <span className="text-rose-600 text-lg">${total}</span>
              </div>
            </div>

            {/* THÔNG BÁO THÔNG TIN RÕ RÀNG VỀ QUY ĐỊNH HẠN 10H & PHẠT 10%/GIỜ */}
            <div className="space-y-2.5 rounded-2xl bg-amber-50 p-4 text-xs text-amber-950 border border-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base" />
                <span>Quy định Trả phòng & Phạt trễ quá giờ</span>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-amber-900">
                <li>
                  Giờ trả phòng tự động: <strong>{calculatedCheckOutTime}</strong> ngày{" "}
                  <strong>{new Date(pendingFormData.ngayDi).toLocaleDateString("vi-VN")}</strong>.
                </li>
                <li>
                  <strong>Hạn trễ miễn phí:</strong> Cho phép trả trễ tối đa đến <strong>{graceTimeStr}</strong>.
                </li>
                <li>
                  <strong>Mức phạt sau {graceTimeStr}:</strong> Trả phòng sau <strong>{graceTimeStr}</strong> sẽ bị phạt <strong>10% tiền phòng/đêm (${penaltyPerLateHour}/giờ)</strong> cho mỗi 1 tiếng quá hạn.
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="secondary"
                onClick={() => setPendingFormData(null)}
              >
                Hủy
              </Button>
              <Button
                loading={bookingLoading}
                variant="create"
                onClick={executeBooking}
              >
                <i className="fa-solid fa-circle-check" />
                Tôi đã hiểu & Xác nhận đặt phòng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BookingCard;
