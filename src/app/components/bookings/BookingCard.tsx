"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import Button from "@/app/components/ui/Button";
import StatusMessage from "@/app/components/ui/StatusMessage";
import { createBooking, getApiErrorMessage, getBookings } from "@/app/lib/api";
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
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const {
    control,
    formState: { errors, isSubmitting },
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
  const nights = Math.max(
    Math.ceil(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
        86_400_000,
    ) || 0,
    0,
  );
  const staySubtotal = price * nights * billableGuests;
  const serviceFee = staySubtotal > 0 ? Math.round(staySubtotal * 0.12) : 0;
  const total = staySubtotal + serviceFee;

  //==== Đồng bộ giá đặt phòng: cập nhật form khi bộ lọc ngày hoặc số khách thay đổi ====
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  //==== Tạo đặt phòng: kiểm tra đăng nhập, sức chứa và xung đột lịch trước khi gửi ====
  const submit = async (values: BookingFormData) => {
    setMessage(null);
    if (!user) {
      setMessage({
        text: "Vui lòng đăng nhập từ menu tài khoản để đặt phòng.",
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
          text: "Phòng vừa được đặt trong khoảng ngày này. Vui lòng chọn ngày khác.",
          type: "error",
        });
        return;
      }

      await createBooking({
        id: 0,
        maNguoiDung: user.id,
        maPhong: roomId,
        ngayDen: new Date(values.ngayDen).toISOString(),
        ngayDi: new Date(values.ngayDi).toISOString(),
        soLuongKhach: values.soLuongKhach,
      });
      setMessage(null);
      showToast("Đặt phòng thành công.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể đặt phòng."),
        type: "error",
      });
    }
  };

  //==== Giao diện đặt phòng: hiển thị bảng giá desktop và sheet thao tác trên mobile ====
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

        <form className="mt-5 space-y-4" onSubmit={handleSubmit(submit)}>
          {message && (
            <StatusMessage message={message.text} type={message.type} />
          )}
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-300">
            <label className="p-3">
              <span className="block text-[10px] font-bold uppercase">
                Nhận phòng
              </span>
              <input
                className="mt-1 w-full bg-transparent text-xs outline-none sm:text-sm"
                min={formatDateForInput(new Date())}
                type="date"
                {...register("ngayDen")}
              />
            </label>
            <label className="border-l border-gray-300 p-3">
              <span className="block text-[10px] font-bold uppercase">
                Trả phòng
              </span>
              <input
                className="mt-1 w-full bg-transparent text-xs outline-none sm:text-sm"
                min={arrival}
                type="date"
                {...register("ngayDi")}
              />
            </label>
            <label className="col-span-2 border-t border-gray-300 p-3">
              <span className="block text-[10px] font-bold uppercase">
                Số khách
              </span>
              <select
                className="mt-1 w-full bg-transparent text-sm outline-none"
                {...register("soLuongKhach", { valueAsNumber: true })}
              >
                {Array.from({ length: Math.max(maxGuests, 1) }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} khách
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(errors.ngayDen || errors.ngayDi || errors.soLuongKhach) && (
            <p className="text-xs text-red-500">
              {errors.ngayDen?.message ||
                errors.ngayDi?.message ||
                errors.soLuongKhach?.message}
            </p>
          )}
          <Button
            className="w-full"
            loading={isSubmitting}
            type="submit"
            variant="create"
          >
            Xác nhận đặt phòng
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Bạn chưa bị trừ tiền ở bước này
        </p>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              ${price} × {nights} đêm × {billableGuests} khách
            </span>
            <span>${staySubtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phí dịch vụ</span>
            <span>${serviceFee}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-4 font-semibold">
            <span>Tổng trước thuế</span>
            <span>${total}</span>
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
    </>
  );
};

export default BookingCard;
