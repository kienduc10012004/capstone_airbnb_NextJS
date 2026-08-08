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
  getBookingsByUser,
  updateBooking,
  type ApiBooking,
  type ApiRoom,
} from "@/app/lib/api";
import { formatDateForInput } from "@/app/lib/date";
import { bookingSchema } from "@/app/lib/schemas";
import { getImageSource } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";
import { useToastStore } from "@/app/store/useToastStore";

type BookingHistoryProps = {
  userId: number;
};

const BookingHistory = ({ userId }: BookingHistoryProps) => {
  const showToast = useToastStore((state) => state.showToast);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [editing, setEditing] = useState<ApiBooking | null>(null);
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

  //==== Tải lịch sử chuyến đi: lấy lượt đặt của người dùng và ghép thông tin phòng ====
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

  //==== Chỉnh sửa chuyến đi: tải chi tiết và lưu ngày hoặc số khách mới ====
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

    setSaving(true);
    try {
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
      showToast("Đã cập nhật chuyến đi.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể cập nhật đặt phòng."),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  //==== Hủy chuyến đi: xóa lượt đặt sau khi người dùng xác nhận ====
  const confirmCancel = async () => {
    if (!deletingBookingId) return;

    setDeleting(true);
    try {
      await deleteBooking(deletingBookingId);
      setBookings((current) =>
        current.filter((booking) => booking.id !== deletingBookingId),
      );
      setMessage(null);
      showToast("Đã hủy chuyến đi.", "success");
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

  //==== Giao diện lịch sử đặt phòng: hiển thị trạng thái và các hộp thoại thao tác ====
  return (
    <section className="mt-10">
      <div>
        <p className="text-sm font-semibold text-rose-500">Hành trình</p>
        <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">Chuyến đi của bạn</h2>
      </div>
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
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {bookings.map((booking) => {
            const room = roomMap.get(booking.maPhong);
            const imageSource = getImageSource(room?.hinhAnh);
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
                  {room && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-gray-500 dark:text-slate-400">
                      {room.wifi && <span className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-slate-800/60 dark:text-slate-300">Wifi</span>}
                      {room.mayGiat && <span className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-slate-800/60 dark:text-slate-300">Máy giặt</span>}
                      {room.tivi && <span className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-slate-800/60 dark:text-slate-300">Tivi</span>}
                      {room.doXe && <span className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-slate-800/60 dark:text-slate-300">Đỗ xe</span>}
                      {room.hoBoi && <span className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-slate-800/60 dark:text-slate-300">Hồ bơi</span>}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${room?.giaTien || 0} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">/ đêm</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="edit"
                        onClick={() => startEditing(booking.id)}
                      >
                        Đổi lịch
                      </Button>
                      <Button
                        variant="delete"
                        onClick={() => setDeletingBookingId(booking.id)}
                      >
                        Hủy chuyến
                      </Button>
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
                  name="ngayDen"
                  type="date"
                />
              </label>
              <label className="text-sm font-medium">
                Ngày trả phòng
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  defaultValue={formatDateForInput(editing.ngayDi)}
                  name="ngayDi"
                  type="date"
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Số khách
              <input
                className={`${uiClassNames.field} mt-1.5`}
                defaultValue={editing.soLuongKhach}
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
      <DeleteConfirmDialog
        confirmLabel="Hủy chuyến"
        description="Chuyến đi này sẽ bị hủy khỏi tài khoản của bạn. Hành động này không thể hoàn tác."
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
