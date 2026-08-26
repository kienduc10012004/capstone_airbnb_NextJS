"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import StatusMessage from "@/app/components/ui/StatusMessage";
import BookingDateSelector from "@/app/components/bookings/BookingDateSelector";
import {
  createBooking,
  getApiErrorMessage,
  getBookings,
  getRoomById,
} from "@/app/lib/api";
import type { ApiBooking } from "@/app/lib/api/bookings";
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [existingBookings, setExistingBookings] = useState<ApiBooking[]>([]);

  // Tải danh sách booking của hệ thống khi mount để phát hiện ngày đã kín
  useEffect(() => {
    let active = true;
    getBookings()
      .then((res) => {
        if (active && Array.isArray(res?.content)) {
          setExistingBookings(res.content);
        }
      })
      .catch(() => {
        if (active) setExistingBookings([]);
      });
    return () => {
      active = false;
    };
  }, []);

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
    setValue,
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
  const nights = Math.max(
    Math.ceil(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
      86_400_000,
    ) || 0,
    1,
  );

  const staySubtotal = price * nights;
  const serviceFee = Math.round(staySubtotal * 0.12);
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
  const executeBooking = async () => {
    if (!pendingFormData || !user) return;

    setBookingLoading(true);
    try {
      // Re-validate chống race-condition
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
        `${pendingFormData.ngayDen}T00:00:00`,
      ).toISOString();
      const endIso = new Date(
        `${pendingFormData.ngayDi}T00:00:00`,
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
        className={`${uiClassNames.surface} ${mobileOpen
            ? "fixed inset-x-0 bottom-0 z-[100] max-h-[88vh] overflow-y-auto rounded-b-none p-5 transition-transform duration-300 ease-out starting:translate-y-full"
            : "hidden"
          } lg:sticky lg:top-24 lg:block lg:self-start lg:p-7 w-full shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200/80 dark:border-white/10`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 lg:hidden">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">
            Đặt phòng
          </h2>
          <button
            aria-label="Đóng"
            className={`${uiClassNames.iconButton} h-9 w-9 text-xl`}
            type="button"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        {/* Header Giá phòng */}
        <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-white/10 pb-5">
          <div>
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              ${price}
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 ml-1">
              / đêm
            </span>
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {rating ? `★ ${rating.toFixed(1)} · ${reviewCount} đánh giá` : "Mới đăng"}
          </span>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={handleSubmit(handlePreSubmit)}
        >
          {message && (
            <StatusMessage
              action={
                message.type === "error"
                  ? {
                    label: "Chọn lại ngày",
                    onClick: () => setCalendarOpen(true),
                  }
                  : undefined
              }
              message={message.text}
              type={message.type}
            />
          )}

          {/* Khung Ngày nhận / Ngày trả phòng & Số khách */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/50 shadow-sm">
            <BookingDateSelector
              checkIn={arrival}
              checkOut={departure}
              existingBookings={existingBookings}
              isOpen={calendarOpen}
              roomId={roomId}
              onOpenChange={setCalendarOpen}
              onSelectRange={(range) => {
                setValue("ngayDen", range.checkIn, { shouldValidate: true });
                setValue("ngayDi", range.checkOut, { shouldValidate: true });
                if (range.checkIn && range.checkOut) {
                  setMessage(null);
                }
              }}
            />

            {/* Số khách */}
            <div className="p-3 rounded-b-2xl">
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                  Khách
                </span>
                <select
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
                  {...register("soLuongKhach", { valueAsNumber: true })}
                >
                  {Array.from({ length: Math.max(maxGuests, 1) }, (_, index) => (
                    <option
                      key={index + 1}
                      className="dark:bg-slate-800 text-gray-900 dark:text-white"
                      value={index + 1}
                    >
                      {index + 1} khách
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {(errors.ngayDen || errors.ngayDi || errors.soLuongKhach) && (
            <p className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-500/30">
              {errors.ngayDen?.message ||
                errors.ngayDi?.message ||
                errors.soLuongKhach?.message}
            </p>
          )}

          <Button
            className="w-full py-3.5 text-base font-extrabold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            type="submit"
            variant="create"
          >
            Đặt phòng
          </Button>
        </form>

        <p className="mt-3 text-center text-xs text-gray-500 dark:text-slate-400">
          Bạn chưa bị trừ tiền ở bước này
        </p>

        {/* THÔNG TIN CHI PHÍ & THANH TOÁN */}
        <div className="mt-5 space-y-3 rounded-2xl bg-gray-50/90 dark:bg-slate-800/80 p-5 border border-gray-200/80 dark:border-white/10">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-slate-300">
            <span>
              ${price} × {nights} đêm
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ${staySubtotal}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-slate-300">
            <span>Phí dịch vụ Airbnb (12%)</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ${serviceFee}
            </span>
          </div>

          {/* Highlight Hộp Tổng Tiền Lớn */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 rounded-xl p-3.5">
            <div>
              <span className="block text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Tổng trước thuế
              </span>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                ({nights} đêm · {billableGuests} khách)
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
                / đêm
              </span>
            </p>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Tổng: ${total}
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

      {/* POPUP XÁC NHẬN ĐẶT PHÒNG */}
      <Modal
        open={Boolean(pendingFormData)}
        title="Xác nhận chuyến đi"
        onClose={() => setPendingFormData(null)}
      >
        {pendingFormData && (
          <div className="space-y-4">
            {/* Chi tiết đặt phòng */}
            <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/60 p-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-calendar-plus text-rose-500 mr-2" />
                  Nhận phòng
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {new Date(pendingFormData.ngayDen).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-calendar-minus text-amber-500 mr-2" />
                  Trả phòng
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {new Date(pendingFormData.ngayDi).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  <i className="fa-solid fa-moon text-purple-500 mr-2" />
                  Thời gian lưu trú
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {nights} đêm
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

            {/* HỘP TỔNG CHI PHÍ */}
            <div className="flex items-center justify-between rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-4">
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Tổng chi phí
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  ${price} × {nights} đêm + 12% phí dịch vụ
                </span>
              </div>
              <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400">
                ${total}
              </span>
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
                className="font-extrabold shadow-md bg-rose-600 hover:bg-rose-700 text-white"
                loading={bookingLoading}
                onClick={executeBooking}
              >
                <i className="fa-solid fa-circle-check" />
                Xác nhận đặt phòng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BookingCard;
