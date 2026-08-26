"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import Modal from "@/app/components/ui/Modal";
import StatusMessage from "@/app/components/ui/StatusMessage";
import {
  deleteBooking,
  getAllRooms,
  getApiErrorMessage,
  getBookingById,
  getBookings,
  getBookingsByUser,
  updateBooking,
  type ApiBooking,
  type ApiRoom,
} from "@/app/lib/api";
import { validateBookingBusinessRules } from "@/app/lib/booking-availability";
import { formatDateForInput } from "@/app/lib/date";
import { getImageSource } from "@/app/lib/image";
import { bookingSchema } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { useToastStore } from "@/app/store/useToastStore";

type BookingHistoryProps = {
  userId: number;
};

type TripStatusFilter = "all" | "upcoming" | "urgent" | "in_progress" | "completed";

// Tính thời gian còn lại (giờ) từ hiện tại đến lúc nhận phòng (quy ước 14h00)
const getHoursUntilCheckIn = (ngayDen: string) => {
  const checkInDate = new Date(ngayDen);
  if (!ngayDen.includes("T")) {
    checkInDate.setHours(14, 0, 0, 0);
  }
  const now = new Date();
  return (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
};

// Xác định mã trạng thái chuyến đi
const getTripStatusKey = (
  ngayDen: string,
  ngayDi: string,
): "upcoming" | "urgent" | "in_progress" | "completed" => {
  const isCompleted = new Date(ngayDi).getTime() < Date.now();
  if (isCompleted) return "completed";
  const hoursUntilCheckIn = getHoursUntilCheckIn(ngayDen);
  if (hoursUntilCheckIn <= 0) return "in_progress";
  if (hoursUntilCheckIn < 12) return "urgent";
  return "upcoming";
};


const statusTabs: {
  icon: string;
  key: TripStatusFilter;
  label: string;
}[] = [
  { icon: "fa-solid fa-list-check", key: "all", label: "Tất cả" },
  { icon: "fa-solid fa-plane-departure", key: "upcoming", label: "Sắp khởi hành" },
  { icon: "fa-solid fa-clock-rotate-left", key: "urgent", label: "Sắp nhận phòng (<12h)" },
  { icon: "fa-solid fa-house-user", key: "in_progress", label: "Đang lưu trú" },
  { icon: "fa-solid fa-circle-check", key: "completed", label: "Đã hoàn thành" },
];

const BookingHistory = ({ userId }: BookingHistoryProps) => {
  const showToast = useToastStore((state) => state.showToast);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [editing, setEditing] = useState<ApiBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState<TripStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(
    null,
  );
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  //==== Tải lịch sử chuyến đi ====
  useEffect(() => {
    let active = true;
    Promise.all([getBookingsByUser(userId), getAllRooms()])
      .then(([bookingsResponse, roomsResponse]) => {
        if (!active) return;
        setBookings(bookingsResponse.content);
        setRooms(roomsResponse.content);
      })
      .catch(() => {
        if (active) {
          setMessage({
            text: "Không thể tải lịch sử đặt phòng.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const roomMap = new Map(rooms.map((room) => [room.id, room]));

  //==== Số lượng chuyến đi theo từng trạng thái ====
  const statusCounts = {
    all: bookings.length,
    completed: bookings.filter(
      (b) => getTripStatusKey(b.ngayDen, b.ngayDi) === "completed",
    ).length,
    in_progress: bookings.filter(
      (b) => getTripStatusKey(b.ngayDen, b.ngayDi) === "in_progress",
    ).length,
    upcoming: bookings.filter(
      (b) => getTripStatusKey(b.ngayDen, b.ngayDi) === "upcoming",
    ).length,
    urgent: bookings.filter(
      (b) => getTripStatusKey(b.ngayDen, b.ngayDi) === "urgent",
    ).length,
  };

  // Filter danh sách theo tab đang chọn
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return getTripStatusKey(b.ngayDen, b.ngayDi) === statusFilter;
  });

  //==== Mở modal đổi lịch ====
  const startEditing = async (id: number) => {
    setMessage(null);
    try {
      setEditing(await getBookingById(id));
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể tải chi tiết đặt phòng."),
        type: "error",
      });
    }
  };

  //==== Lưu đổi lịch chuyến đi ====
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    const parsed = bookingSchema.safeParse({
      ngayDen: String(formData.get("ngayDen")),
      ngayDi: String(formData.get("ngayDi")),
      soLuongKhach: Number(formData.get("soLuongKhach")),
    });

    if (!parsed.success) {
      setMessage({
        text: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ.",
        type: "error",
      });
      return;
    }

    const room = roomMap.get(editing.maPhong);

    setSaving(true);
    try {
      const allBookingsRes = await getBookings();
      const validation = validateBookingBusinessRules(
        room,
        {
          maNguoiDung: editing.maNguoiDung,
          maPhong: editing.maPhong,
          ngayDen: parsed.data.ngayDen,
          ngayDi: parsed.data.ngayDi,
          soLuongKhach: parsed.data.soLuongKhach,
        },
        allBookingsRes.content,
        editing.id,
      );

      if (!validation.isValid) {
        const errorMsg = validation.message || "Dữ liệu đặt phòng không hợp lệ.";
        setMessage({ text: errorMsg, type: "error" });
        showToast(errorMsg, "error");
        setSaving(false);
        return;
      }

      const response = await updateBooking(editing.id, {
        ...editing,
        ngayDen: new Date(parsed.data.ngayDen).toISOString(),
        ngayDi: new Date(parsed.data.ngayDi).toISOString(),
        soLuongKhach: parsed.data.soLuongKhach,
      });

      setBookings((current) =>
        current.map((booking) =>
          booking.id === editing.id ? response.content : booking,
        ),
      );
      setEditing(null);
      setMessage(null);
      showToast("Đã cập nhật chuyến đi thành công.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể cập nhật đặt phòng."),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  //==== Hủy chuyến đi ====
  const confirmCancel = async () => {
    if (!deletingBookingId) return;

    const targetBooking = bookings.find((b) => b.id === deletingBookingId);
    if (targetBooking) {
      const hoursUntilCheckIn = getHoursUntilCheckIn(targetBooking.ngayDen);
      if (hoursUntilCheckIn < 12) {
        setMessage({
          text: "Không thể hủy phòng khi còn dưới 12 tiếng nữa đến giờ nhận phòng (hoặc chuyến đi đã trôi qua).",
          type: "error",
        });
        setDeletingBookingId(null);
        return;
      }
    }

    setDeleting(true);
    try {
      await deleteBooking(deletingBookingId);
      setBookings((current) =>
        current.filter((booking) => booking.id !== deletingBookingId),
      );
      setMessage(null);
      showToast("Đã hủy chuyến đi thành công.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể hủy đặt phòng."),
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeletingBookingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Đang tải các chuyến đi..." variant="cards" />;
  }

  return (
    <section className="mt-10">
      <div>
        <p className="text-sm font-semibold text-rose-500">Hành trình</p>
        <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          Chuyến đi của bạn
        </h2>
      </div>

      {/* Tab lọc trạng thái chuyến đi */}
      {bookings.length > 0 && (
        <div className="mt-5 overflow-x-auto py-1">
          <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-gray-100/80 p-1.5 dark:border-white/10 dark:bg-white/[0.05]">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.key;
              const count = statusCounts[tab.key];
              return (
                <button
                  className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "bg-white text-gray-900 shadow-md shadow-gray-200/60 dark:bg-rose-500 dark:text-white dark:shadow-rose-500/20"
                      : "text-gray-600 hover:bg-white/60 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                >
                  <i
                    className={`${tab.icon} ${
                      active
                        ? "text-rose-500 dark:text-white"
                        : "text-gray-400 dark:text-slate-500"
                    }`}
                  />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active
                        ? "bg-rose-100 text-rose-700 dark:bg-white/20 dark:text-white"
                        : "bg-gray-200/70 text-gray-600 dark:bg-white/10 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {message && (
        <div className="mt-5">
          <StatusMessage message={message.text} type={message.type} />
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            action={
              <Link
                className="text-sm font-semibold text-rose-600 hover:underline"
                href="/rooms"
              >
                Khám phá phòng ngay
                <i
                  aria-hidden="true"
                  className="fa-solid fa-chevron-right ml-1"
                />
              </Link>
            }
            description="Các phòng bạn đặt sẽ xuất hiện tại đây."
            title="Bạn chưa có chuyến đi nào"
          />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Không có chuyến đi nào ở trạng thái “
            <span className="font-semibold text-gray-900 dark:text-white">
              {statusTabs.find((t) => t.key === statusFilter)?.label}
            </span>
            ”.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filteredBookings.map((booking) => {
            const room = roomMap.get(booking.maPhong);
            const imageSource = getImageSource(room?.hinhAnh);
            const hoursUntilCheckIn = getHoursUntilCheckIn(booking.ngayDen);
            const statusKey = getTripStatusKey(booking.ngayDen, booking.ngayDi);
            const isTooLateToCancel = hoursUntilCheckIn < 12;
            const isCompleted = statusKey === "completed";
            const isInProgress = statusKey === "in_progress";

            return (
              <article
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_20px_rgb(15_23_42/0.05)] transition-shadow hover:shadow-[0_8px_30px_rgb(15_23_42/0.1)] dark:border-white/10 dark:bg-[#1a2236] dark:shadow-[0_4px_20px_rgb(0_0_0/0.3)]"
                key={booking.id}
              >
                <div className="relative h-44 bg-gray-100">
                  {imageSource ? (
                    <Image
                      fill
                      alt={room?.tenPhong || `Phòng #${booking.maPhong}`}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      src={imageSource}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-4xl text-rose-300">
                      ⌂
                    </div>
                  )}

                  {/* Status Badge trên hình */}
                  <div className="absolute top-3 right-3">
                    {statusKey === "completed" && (
                      <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <i className="fa-solid fa-circle-check mr-1" />
                        Đã hoàn thành
                      </span>
                    )}
                    {statusKey === "in_progress" && (
                      <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-md animate-pulse">
                        <i className="fa-solid fa-house-user mr-1" />
                        Đang lưu trú
                      </span>
                    )}
                    {statusKey === "urgent" && (
                      <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <i className="fa-solid fa-clock-rotate-left mr-1" />
                        Sắp nhận phòng (&lt;12h)
                      </span>
                    )}
                    {statusKey === "upcoming" && (
                      <span className="rounded-full bg-rose-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <i className="fa-solid fa-plane-departure mr-1" />
                        Sắp khởi hành
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {room?.tenPhong || `Phòng #${booking.maPhong}`}
                  </h3>
                  {room && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {room.khach} khách · {room.phongNgu} phòng ngủ · {room.giuong} giường · {room.phongTam} phòng tắm
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                    📅 {new Date(booking.ngayDen).toLocaleDateString("vi-VN")} –{" "}
                    {new Date(booking.ngayDi).toLocaleDateString("vi-VN")} ({booking.soLuongKhach} khách)
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${room?.giaTien || 0} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">/ đêm</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {!isCompleted && !isInProgress && (
                        <Button
                          variant="edit"
                          onClick={() => startEditing(booking.id)}
                        >
                          Đổi lịch
                        </Button>
                      )}
                      {!isCompleted && (
                        <Button
                          disabled={isTooLateToCancel}
                          title={
                            isTooLateToCancel
                              ? "Không thể hủy khi còn dưới 12 tiếng nữa đến giờ nhận phòng"
                              : undefined
                          }
                          variant="delete"
                          onClick={() => setDeletingBookingId(booking.id)}
                        >
                          Hủy chuyến
                        </Button>
                      )}
                      <Link
                        className="text-xs font-semibold text-rose-600 hover:underline"
                        href={`/rooms/${booking.maPhong}`}
                      >
                        Xem phòng
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Đổi lịch */}
      <Modal
        open={Boolean(editing)}
        title="Cập nhật chuyến đi"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Ngày nhận phòng
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  defaultValue={formatDateForInput(editing.ngayDen)}
                  min={formatDateForInput(new Date())}
                  name="ngayDen"
                  type="date"
                />
              </label>
              <label className="text-sm font-medium">
                Ngày trả phòng
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  defaultValue={formatDateForInput(editing.ngayDi)}
                  min={formatDateForInput(new Date())}
                  name="ngayDi"
                  type="date"
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Số khách (Tối đa {roomMap.get(editing.maPhong)?.khach || 10} khách)
              <input
                className={`${uiClassNames.field} mt-1.5`}
                defaultValue={editing.soLuongKhach}
                max={roomMap.get(editing.maPhong)?.khach || 10}
                min="1"
                name="soLuongKhach"
                type="number"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Đóng
              </Button>
              <Button loading={saving} type="submit" variant="edit">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Dialog Hủy chuyến */}
      <DeleteConfirmDialog
        confirmLabel="Hủy chuyến"
        description="Chuyến đi này sẽ bị hủy khỏi tài khoản của bạn. Lưu ý: Chỉ được phép hủy trước giờ nhận phòng từ 12 tiếng trở lên."
        loading={deleting}
        open={Boolean(deletingBookingId)}
        title="Xác nhận hủy chuyến"
        onCancel={() => setDeletingBookingId(null)}
        onConfirm={() => void confirmCancel()}
      />
    </section>
  );
};

export default BookingHistory;
