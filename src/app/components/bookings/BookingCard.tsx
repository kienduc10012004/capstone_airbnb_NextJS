"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import AlarmTimePicker from "@/app/components/bookings/AlarmTimePicker";
import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import StatusMessage from "@/app/components/ui/StatusMessage";
import { createBooking, getApiErrorMessage, getBookings, getRoomById } from "@/app/lib/api";
import { OPEN_SIGN_IN_EVENT } from "@/app/lib/auth-events";
import { validateBookingBusinessRules } from "@/app/lib/booking-availability";
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

  // Giờ nhận phòng (HH:mm) mặc định 14:00 (chuẩn khách sạn) hoặc người dùng chọn
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [stayPackage, setStayPackage] = useState<"overnight" | "full_day">(
    "overnight",
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

  // TÍNH TOÁN CHÍNH XÁC GIỜ TRẢ PHÒNG VÀ HẠN TRỄ:
  // 1. Chế độ "Theo Đêm (N Ngày N-1 Đêm)":
  //    - Giờ trả phòng tự động = 12:00 trưa (giờ trả phòng tiêu chuẩn quốc tế)
  //    - Ân hạn miễn phí: Đến 15:00 (ân hạn 3 tiếng)
  //    - Sau 15:00: Phạt 10% tiền phòng/đêm mỗi giờ
  // 2. Chế độ "Trọn Ngày (N Ngày)":
  //    - Giờ trả phòng tự động = Giờ nhận phòng (VD: 08:00 -> 08:00 ngày kết thúc)
  //    - Ân hạn miễn phí: Giờ nhận + 3 tiếng (VD: 08:00 -> 11:00; nếu nhận <= 07:00 thì ân hạn đến 10:00)
  const calculatedCheckOutTime =
    stayPackage === "overnight" ? "12:00" : checkInTime;

  // Tính mốc giờ ân hạn trễ miễn phí
  const [inH] = checkInTime.split(":").map(Number);
  const [outH, outM] = calculatedCheckOutTime.split(":").map(Number);

  const graceHourCalc =
    stayPackage === "overnight"
      ? 15 // Gói theo đêm: 12:00 + 3h = 15:00
      : Math.min(outH + 3, 23); // Gói trọn ngày: giờ trả + 3h

  const graceTimeStr =
    stayPackage === "full_day" && inH <= 7
      ? "10:00"
      : `${String(graceHourCalc).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;

  // Phí phạt trễ giờ: 10% tiền phòng / 1 tiếng trễ
  const penaltyPerLateHour = Math.round(price * 0.1);

  // Số ngày & Đêm lưu trú
  const effectiveDaysCount = rawNights + 1; // Số ngày (VD: 26 đến 28 = 3 ngày)
  const effectiveBilledUnits =
    stayPackage === "full_day" ? effectiveDaysCount : rawNights;

  const staySubtotal = price * effectiveBilledUnits * billableGuests;
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
      // Query dữ liệu mới nhất từ server để kiểm tra nghiệp vụ
      const [roomData, bookingsResponse] = await Promise.all([
        getRoomById(roomId).catch(() => null),
        getBookings(),
      ]);

      const validation = validateBookingBusinessRules(
        roomData,
        {
          maNguoiDung: user.id,
          maPhong: roomId,
          ngayDen: values.ngayDen,
          ngayDi: values.ngayDi,
          soLuongKhach: values.soLuongKhach,
        },
        bookingsResponse.content,
      );

      if (!validation.isValid) {
        const errorMsg = validation.message || "Dữ liệu đặt phòng không hợp lệ.";
        setMessage({ text: errorMsg, type: "error" });
        showToast(errorMsg, "error");
        return;
      }

      // Hợp lệ -> mở Popup xác nhận
      setPendingFormData(values);
    } catch (error) {
      const errorMsg = getApiErrorMessage(error, "Không thể kiểm tra lịch phòng.");
      setMessage({ text: errorMsg, type: "error" });
      showToast(errorMsg, "error");
    }
  };

  //==== BƯỚC 2: Thực hiện ĐẶT PHÒNG chính thức khi bấm nút trong Popup ====
  // Kiểm tra lại toàn bộ dữ liệu ở bước này để chặn race-condition (2 khách đặt cùng lúc)
  const executeBooking = async () => {
    if (!pendingFormData || !user) return;

    setBookingLoading(true);
    try {
      // Tải lại dữ liệu ngay trước thời điểm đặt để ngăn chặn Race Condition
      const [freshRoom, bookingsResponse] = await Promise.all([
        getRoomById(roomId).catch(() => null),
        getBookings(),
      ]);

      const validation = validateBookingBusinessRules(
        freshRoom,
        {
          maNguoiDung: user.id,
          maPhong: roomId,
          ngayDen: pendingFormData.ngayDen,
          ngayDi: pendingFormData.ngayDi,
          soLuongKhach: pendingFormData.soLuongKhach,
        },
        bookingsResponse.content,
      );

      if (!validation.isValid) {
        const errorMsg = validation.message || "Không thể hoàn tất đặt phòng.";
        setMessage({ text: errorMsg, type: "error" });
        showToast(errorMsg, "error");
        setPendingFormData(null);
        return;
      }

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
      const errorMsg = getApiErrorMessage(error, "Không thể đặt phòng.");
      setMessage({ text: errorMsg, type: "error" });
      showToast(errorMsg, "error");
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
        } lg:sticky lg:top-24 lg:block lg:self-start lg:p-7 w-full shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200/80 dark:border-white/10`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 lg:hidden">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">Đặt phòng</h2>
          <button
            aria-label="Đóng"
            className={`${uiClassNames.iconButton} h-9 w-9 text-xl`}
            type="button"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        {/* Header Giá phòng lớn & rõ ràng */}
        <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-white/10 pb-5">
          <div>
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              ${price}
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 ml-1">
              / khách / đêm
            </span>
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {rating ? `★ ${rating.toFixed(1)} · ${reviewCount} đánh giá` : "Mới đăng"}
          </span>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit(handlePreSubmit)}>
          {message && (
            <StatusMessage message={message.text} type={message.type} />
          )}

          {/* Chọn Gói Hình Thức Lưu Trú */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
              Hình thức lưu trú
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 dark:bg-slate-800/90 p-1.5 border border-gray-200/80 dark:border-white/10">
              <button
                type="button"
                className={`rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
                  stayPackage === "overnight"
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-md shadow-black/5 scale-[1.02]"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={() => setStayPackage("overnight")}
              >
                🌙 Theo Đêm ({effectiveDaysCount}N {rawNights}Đ)
              </button>
              <button
                type="button"
                className={`rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
                  stayPackage === "full_day"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-[1.02]"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={() => setStayPackage("full_day")}
              >
                ☀️ Trọn Ngày ({effectiveDaysCount} Ngày)
              </button>
            </div>
          </div>

          {/* Khung Nhận phòng & Trả phòng rộng rãi */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/50 shadow-sm">
            {/* Hàng 1: NHẬN PHÒNG */}
            <div className="p-3.5 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                  <i className="fa-solid fa-calendar-check" />
                  Nhận phòng
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
                  {stayPackage === "overnight" ? "Check-in từ 14:00" : "Check-in tự chọn"}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Giờ:</span>
                  <AlarmTimePicker value={checkInTime} onChange={setCheckInTime} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Ngày:</span>
                  <input
                    className="rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-rose-500 [color-scheme:light_dark]"
                    min={formatDateForInput(new Date())}
                    type="date"
                    {...register("ngayDen")}
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: TRẢ PHÒNG (TỰ ĐỘNG TÍNH TOÁN) */}
            <div className="p-3.5 border-b border-gray-100 dark:border-white/10 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  <i className="fa-solid fa-calculator" />
                  Trả phòng (Tự động)
                </span>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  {stayPackage === "overnight" ? "Chuẩn 12:00 trưa" : `Đúng ${calculatedCheckOutTime}`}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Giờ:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-900/40 border border-amber-300/80 dark:border-amber-500/40 px-3 py-1.5 text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300 shadow-sm">
                    <i className="fa-regular fa-clock" />
                    {calculatedCheckOutTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Ngày:</span>
                  <input
                    className="rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-800/80 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-amber-500 [color-scheme:light_dark]"
                    min={arrival}
                    type="date"
                    {...register("ngayDi")}
                  />
                </div>
              </div>
            </div>

            {/* Số khách */}
            <div className="p-3.5">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1.5">
                  Số lượng khách
                </span>
                <select
                  className="w-full rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-slate-800/80 p-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-rose-500"
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
          </div>

          {/* Quy định trả phòng Accordion */}
          <div className="overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20">
            <button
              type="button"
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
              onClick={() => setShowPolicyAccordion((prev) => !prev)}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-amber-600 dark:text-amber-400 text-sm" />
                <span>Quy định giờ trả phòng & Phí phạt trễ</span>
              </span>
              <i className={`fa-solid fa-chevron-down text-[11px] transition-transform duration-200 ${showPolicyAccordion ? "rotate-180" : ""}`} />
            </button>

            {showPolicyAccordion && (
              <div className="border-t border-amber-200/60 dark:border-amber-500/20 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200/90 space-y-2 bg-amber-50/80 dark:bg-amber-950/40">
                <p>
                  • <strong>Giờ trả phòng tự động:</strong> <strong className="text-amber-950 dark:text-amber-100 underline">{calculatedCheckOutTime}</strong> ngày trả phòng.
                </p>
                <p>
                  • <strong>Ân hạn miễn phí:</strong> Cho phép trả trễ tối đa đến <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{graceTimeStr}</strong> (ân hạn 3 tiếng).
                </p>
                <p>
                  • <strong>Phí trễ quá mốc:</strong> Trả phòng sau {graceTimeStr} sẽ bị phạt <strong className="text-rose-700 dark:text-rose-300 font-bold">10% tiền phòng/đêm (${penaltyPerLateHour}/giờ)</strong>.
                </p>
              </div>
            )}
          </div>

          {(errors.ngayDen || errors.ngayDi || errors.soLuongKhach) && (
            <p className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-500/30">
              {errors.ngayDen?.message ||
                errors.ngayDi?.message ||
                errors.soLuongKhach?.message}
            </p>
          )}

          <Button className="w-full py-3.5 text-base font-extrabold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all" type="submit" variant="create">
            Xác nhận đặt phòng
          </Button>
        </form>

        <p className="mt-3 text-center text-xs text-gray-500 dark:text-slate-400">
          Bạn chưa bị trừ tiền ở bước này
        </p>

        {/* THÔNG TIN CHI PHÍ & THANH TOÁN TO RÕ RÀNG */}
        <div className="mt-5 space-y-3 rounded-2xl bg-gray-50/90 dark:bg-slate-800/80 p-5 border border-gray-200/80 dark:border-white/10">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-slate-300">
            <span>
              ${price} × {effectiveBilledUnits} {stayPackage === "full_day" ? "ngày" : "đêm"} × {billableGuests} khách
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ${staySubtotal}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-slate-300">
            <span>Phí dịch vụ hệ thống (12%)</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ${serviceFee}
            </span>
          </div>

          {/* Highlight Hộp Tổng Tiền Lớn & Rõ */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 rounded-xl p-3.5">
            <div>
              <span className="block text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Tổng thanh toán
              </span>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                (Đã gồm thuế & phí)
              </span>
            </div>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              ${total}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Bar */}
      {!mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 px-5 py-3.5 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur-lg lg:hidden">
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              ${price}{" "}
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                / khách / đêm
              </span>
            </p>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Tổng tạm tính: ${total}
            </p>
          </div>
          <Button
            className="min-w-36 font-bold shadow-md"
            variant="create"
            onClick={() => setMobileOpen(true)}
          >
            Đặt phòng
          </Button>
        </div>
      )}

      {/* POPUP XÁC NHẬN ĐẶT PHÒNG HÀI HÒA & THÔNG TIN GIÁ TO RÕ RÀNG */}
      <Modal
        open={Boolean(pendingFormData)}
        title="Xác nhận chi tiết chuyến đi"
        onClose={() => setPendingFormData(null)}
      >
        {pendingFormData && (
          <div className="space-y-4">
            {/* Banner đầu trang */}
            <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/5 dark:from-rose-500/20 dark:to-pink-500/10 border border-rose-200 dark:border-rose-500/30 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                <i className="fa-solid fa-house-chimney text-base" />
                <span>Thông tin chi tiết chuyến đi & Gói lưu trú</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">
                Vui lòng kiểm tra kỹ ngày/giờ trả phòng tự động và quy định phạt trễ trước khi xác nhận.
              </p>
            </div>

            {/* Chi tiết đặt phòng */}
            <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/60 p-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-layer-group text-purple-500 mr-2" />
                  Gói lưu trú chọn
                </span>
                <span className="font-extrabold text-gray-900 dark:text-white">
                  {stayPackage === "full_day"
                    ? `☀️ Trọn Ngày (${effectiveDaysCount} Ngày)`
                    : `🌙 Theo Đêm (${effectiveDaysCount} Ngày ${rawNights} Đêm)`}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-calendar-plus text-rose-500 mr-2" />
                  Nhận phòng
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {new Date(pendingFormData.ngayDen).toLocaleDateString("vi-VN")} lúc{" "}
                  <span className="text-rose-600 dark:text-rose-400 font-black">{checkInTime}</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-calendar-minus text-amber-500 mr-2" />
                  Trả phòng tự động
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {new Date(pendingFormData.ngayDi).toLocaleDateString("vi-VN")} lúc{" "}
                  <span className="text-amber-600 dark:text-amber-400 font-black">{calculatedCheckOutTime}</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-clock text-emerald-600 mr-2" />
                  Hạn chót trễ (Miễn phí)
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  Tối đa đến {graceTimeStr}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-users text-blue-500 mr-2" />
                  Số lượng khách
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {pendingFormData.soLuongKhach} khách
                </span>
              </div>
            </div>

            {/* HỘP TỔNG CHI PHÍ NỔI BẬT TO RÕ */}
            <div className="flex items-center justify-between rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-4">
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Tổng chi phí thanh toán
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  ${price} × {effectiveBilledUnits} {stayPackage === "full_day" ? "ngày" : "đêm"} × {billableGuests} khách + 12% phí
                </span>
              </div>
              <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400">
                ${total}
              </span>
            </div>

            {/* Quy định phạt trễ rõ ràng */}
            <div className="space-y-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base" />
                <span>Quy định Trả phòng & Phạt trễ quá giờ</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-900 dark:text-amber-200/90 leading-relaxed">
                <li>
                  Giờ trả phòng tự động: <strong>{calculatedCheckOutTime}</strong> ngày{" "}
                  <strong>{new Date(pendingFormData.ngayDi).toLocaleDateString("vi-VN")}</strong>.
                </li>
                <li>
                  <strong>Hạn trễ miễn phí:</strong> Cho phép trả trễ tối đa đến <strong>{graceTimeStr}</strong>.
                </li>
                <li>
                  <strong>Mức phạt sau {graceTimeStr}:</strong> Bị phạt <strong>10% tiền phòng/đêm (${penaltyPerLateHour}/giờ)</strong> cho mỗi 1 tiếng quá hạn.
                </li>
              </ul>
            </div>

            {/* Nút hành động */}
            <div className="flex flex-wrap justify-end gap-2.5 border-t border-gray-100 dark:border-white/10 pt-3">
              <Button
                variant="secondary"
                onClick={() => setPendingFormData(null)}
              >
                Hủy
              </Button>
              <Button
                className="font-extrabold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                loading={bookingLoading}
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
