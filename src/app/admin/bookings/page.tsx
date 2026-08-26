"use client";

import { useEffect, useMemo, useState } from "react";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSearchBar from "@/app/components/admin/AdminSearchBar";
import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import Modal from "@/app/components/ui/Modal";
import Pagination from "@/app/components/ui/Pagination";
import {
  deleteBooking,
  getAllRooms,
  getApiErrorMessage,
  getBookingById,
  getBookings,
  getUsers,
  updateBooking,
  type ApiBooking,
  type ApiRoom,
  type ApiUser,
} from "@/app/lib/api";
import { formatDateForInput } from "@/app/lib/date";
import { validateBookingBusinessRules } from "@/app/lib/booking-availability";
import { bookingSchema } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { useToastStore } from "@/app/store/useToastStore";

const PAGE_SIZE = 15;

export default function AdminBookingsPage() {
  const showToast = useToastStore((state) => state.showToast);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState<ApiBooking | null>(
    null,
  );
  const [editing, setEditing] = useState<ApiBooking | null>(null);

  const loadBookings = async () => {
    const response = await getBookings();
    setBookings(response.content);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getBookings(), getAllRooms(), getUsers()])
      .then(([bookingsResponse, roomsResponse, usersResponse]) => {
        if (!active) return;
        setBookings(bookingsResponse.content);
        setRooms(roomsResponse.content);
        setUsers(usersResponse.content);
      })
      .catch(() => {
        if (active) {
          showToast("Không thể tải dữ liệu đặt phòng.", "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const roomMap = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredBookings = bookings.filter((booking) => {
    if (!normalizedKeyword) return true;
    const roomName = roomMap.get(booking.maPhong)?.tenPhong ?? "";
    const user = userMap.get(booking.maNguoiDung);
    return [roomName, user?.name, user?.email, String(booking.id)].some(
      (value) => value?.toLowerCase().includes(normalizedKeyword),
    );
  });

  const totalPages = Math.max(
    Math.ceil(filteredBookings.length / PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedBookings = filteredBookings.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  const openEdit = async (id: number) => {
    try {
      setEditing(await getBookingById(id));
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể tải chi tiết đặt phòng."), "error");
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    const parsed = bookingSchema.safeParse({
      ngayDen: String(formData.get("ngayDen")),
      ngayDi: String(formData.get("ngayDi")),
      soLuongKhach: Number(formData.get("soLuongKhach")),
    });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ.", "error");
      return;
    }

    const targetRoomId = Number(formData.get("maPhong"));
    const targetRoom = roomMap.get(targetRoomId);

    const validation = validateBookingBusinessRules(
      targetRoom,
      {
        maNguoiDung: editing.maNguoiDung,
        maPhong: targetRoomId,
        ngayDen: parsed.data.ngayDen,
        ngayDi: parsed.data.ngayDi,
        soLuongKhach: parsed.data.soLuongKhach,
      },
      bookings,
      editing.id,
    );

    if (!validation.isValid) {
      showToast(validation.message || "Dữ liệu đặt phòng không hợp lệ.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateBooking(editing.id, {
        id: editing.id,
        maNguoiDung: editing.maNguoiDung,
        maPhong: targetRoomId,
        ngayDen: new Date(parsed.data.ngayDen).toISOString(),
        ngayDi: new Date(parsed.data.ngayDi).toISOString(),
        soLuongKhach: parsed.data.soLuongKhach,
      });
      await loadBookings();
      setEditing(null);
      showToast("Đã cập nhật đặt phòng thành công.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể cập nhật đặt phòng."), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!deletingBooking) return;

    setDeleting(true);
    try {
      await deleteBooking(deletingBooking.id);
      setBookings((current) =>
        current.filter((item) => item.id !== deletingBooking.id),
      );
      showToast(`Đã hủy đặt phòng #${deletingBooking.id} thành công.`, "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể hủy đặt phòng."), "error");
    } finally {
      setDeleting(false);
      setDeletingBooking(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Theo dõi, cập nhật lịch và hủy các lượt đặt trong hệ thống."
        title="Quản lý đặt phòng"
      />

      {/* Thanh tìm kiếm Debouncing */}
      <AdminSearchBar
        placeholder="Tìm kiếm theo mã đặt phòng, khách hàng hoặc tên phòng..."
        value={keyword}
        onChange={(val) => {
          setKeyword(val);
          setCurrentPage(1);
        }}
      />

      {loading && paginatedBookings.length === 0 ? (
        <LoadingState label="Đang tải đặt phòng..." variant="table" />
      ) : paginatedBookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Không có lượt đặt phù hợp với tìm kiếm hiện tại."
            title="Không có dữ liệu"
          />
        </div>
      ) : (
        <>
          <div
            className={`${uiClassNames.adminCard} relative mt-6 w-full max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-330px)]`}
          >
            {loading && <LoadingOverlay label="Đang cập nhật đặt phòng..." />}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[920px] text-left text-sm whitespace-nowrap">
                <thead className={uiClassNames.adminTableHead}>
                  <tr>
                    <th className="px-5 py-4">Mã</th>
                    <th className="px-5 py-4">Khách hàng</th>
                    <th className="px-5 py-4">Phòng</th>
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-5 py-4">Khách</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedBookings.map((booking) => {
                    const user = userMap.get(booking.maNguoiDung);
                    return (
                      <tr
                        className={uiClassNames.adminTableRow}
                        key={booking.id}
                      >
                        <td className="px-5 py-4 font-mono text-xs text-gray-400 dark:text-slate-500">
                          #{booking.id}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user?.name || `User #${booking.maNguoiDung}`}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                            {user?.email || "Chưa có email"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-gray-700 dark:text-slate-200 max-w-64 truncate">
                          {roomMap.get(booking.maPhong)?.tenPhong ||
                            `Phòng #${booking.maPhong}`}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-gray-600 dark:text-slate-300">
                          {new Date(booking.ngayDen).toLocaleDateString(
                            "vi-VN",
                          )}{" "}
                          →{" "}
                          {new Date(booking.ngayDi).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-800 dark:text-slate-200">
                          {booking.soLuongKhach} khách
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              className="min-w-[68px] text-xs font-bold py-1.5 justify-center"
                              variant="edit"
                              onClick={() => void openEdit(booking.id)}
                            >
                              <i className="fa-solid fa-pen-to-square" />
                              Sửa
                            </Button>
                            <Button
                              className="min-w-[68px] text-xs font-bold py-1.5 justify-center"
                              variant="delete"
                              onClick={() => setDeletingBooking(booking)}
                            >
                              <i className="fa-solid fa-trash" />
                              Hủy
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </>
      )}

      {/* Modal Sửa đặt phòng */}
      <Modal
        open={Boolean(editing)}
        title="Cập nhật đặt phòng"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form className="space-y-4" onSubmit={(e) => void submit(e)}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
              Phòng
              <select
                className={`${uiClassNames.field} mt-1.5 cursor-pointer`}
                defaultValue={editing.maPhong}
                name="maPhong"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.tenPhong}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Ngày nhận phòng
                <input
                  className={`${uiClassNames.field} mt-1.5 [color-scheme:light_dark]`}
                  defaultValue={formatDateForInput(editing.ngayDen)}
                  name="ngayDen"
                  type="date"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Ngày trả phòng
                <input
                  className={`${uiClassNames.field} mt-1.5 [color-scheme:light_dark]`}
                  defaultValue={formatDateForInput(editing.ngayDi)}
                  name="ngayDi"
                  type="date"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
              Số lượng khách
              <input
                className={`${uiClassNames.field} mt-1.5`}
                defaultValue={editing.soLuongKhach}
                min="1"
                name="soLuongKhach"
                type="number"
              />
            </label>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Hủy
              </Button>
              <Button
                className="font-bold shadow-md"
                loading={saving}
                type="submit"
                variant="create"
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Xác nhận hủy đặt phòng có đếm ngược 5 giây */}
      <DeleteConfirmDialog
        countdownSeconds={5}
        description={`Đặt phòng #${deletingBooking?.id ?? ""} sẽ bị hủy khỏi hệ thống. Vui lòng chờ 5 giây để xác nhận thao tác.`}
        loading={deleting}
        open={Boolean(deletingBooking)}
        title="Xác nhận hủy đặt phòng"
        onCancel={() => setDeletingBooking(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
