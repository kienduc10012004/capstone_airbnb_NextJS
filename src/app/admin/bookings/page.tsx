"use client";

import { useEffect, useMemo, useState } from "react";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import Modal from "@/app/components/ui/Modal";
import Pagination from "@/app/components/ui/Pagination";
import StatusMessage from "@/app/components/ui/StatusMessage";
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
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState<ApiBooking | null>(
    null,
  );
  const [editing, setEditing] = useState<ApiBooking | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  //==== Tải dữ liệu đặt phòng: lấy lượt đặt cùng thông tin phòng và người dùng liên quan ====
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
          setMessage({
            text: "Không thể tải dữ liệu đặt phòng.",
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
  }, []);

  const roomMap = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );
  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const normalizedKeyword = appliedKeyword.trim().toLowerCase();
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

  //==== Lọc và chỉnh sửa đặt phòng: xử lý tìm kiếm, mở form và lưu lịch mới ====
  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedKeyword(keyword.trim());
    setCurrentPage(1);
  };

  const clearFilter = () => {
    setKeyword("");
    setAppliedKeyword("");
    setCurrentPage(1);
  };

  const openEdit = async (id: number) => {
    try {
      setEditing(await getBookingById(id));
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể tải chi tiết đặt phòng."),
        type: "error",
      });
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
      setMessage({
        text: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ.",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      await updateBooking(editing.id, {
        ...editing,
        maNguoiDung: Number(formData.get("maNguoiDung")),
        maPhong: Number(formData.get("maPhong")),
        ngayDen: new Date(parsed.data.ngayDen).toISOString(),
        ngayDi: new Date(parsed.data.ngayDi).toISOString(),
        soLuongKhach: parsed.data.soLuongKhach,
      });
      await loadBookings();
      setEditing(null);
      setMessage(null);
      showToast("Đã cập nhật đặt phòng.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể cập nhật đặt phòng."),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  //==== Hủy đặt phòng: xóa lượt đặt sau khi quản trị viên xác nhận ====
  const confirmRemove = async () => {
    if (!deletingBooking) return;

    setDeleting(true);
    try {
      await deleteBooking(deletingBooking.id);
      setBookings((current) =>
        current.filter((item) => item.id !== deletingBooking.id),
      );
      setMessage(null);
      showToast("Đã hủy đặt phòng.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể hủy đặt phòng."),
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeletingBooking(null);
    }
  };

  //==== Giao diện quản lý đặt phòng: hiển thị bảng, phân trang và hộp thoại thao tác ====
  return (
    <div>
      <AdminPageHeader
        description="Theo dõi, cập nhật lịch và hủy các lượt đặt trong hệ thống."
        title="Quản lý đặt phòng"
      />
      <form
        className={`${uiClassNames.surface} mt-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]`}
        onSubmit={search}
      >
        <input
          className={`${uiClassNames.field} col-span-2 sm:col-span-1`}
          placeholder="Tìm theo mã, người dùng hoặc tên phòng"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Button className="w-full whitespace-nowrap" type="submit">
          Tìm
        </Button>
        <Button
          className="w-full whitespace-nowrap"
          disabled={!keyword && !appliedKeyword}
          variant="secondary"
          onClick={clearFilter}
        >
          Xóa lọc
        </Button>
      </form>
      {message && (
        <div className="mt-5">
          <StatusMessage message={message.text} type={message.type} />
        </div>
      )}
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
            className={`${uiClassNames.surface} relative mt-6 w-full max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-314px)]`}
          >
            {loading && <LoadingOverlay label="Đang cập nhật đặt phòng..." />}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[920px] text-left text-sm whitespace-nowrap">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Mã</th>
                    <th className="px-5 py-4">Khách hàng</th>
                    <th className="px-5 py-4">Phòng</th>
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-5 py-4">Khách</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedBookings.map((booking) => {
                    const user = userMap.get(booking.maNguoiDung);
                    return (
                      <tr
                        className="transition-colors duration-300 ease-out hover:bg-gray-50"
                        key={booking.id}
                      >
                        <td className="px-5 py-4 text-gray-500">
                          #{booking.id}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {user?.name || `User #${booking.maNguoiDung}`}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {user?.email || "—"}
                          </p>
                        </td>
                        <td className="max-w-65 truncate px-5 py-4">
                          {roomMap.get(booking.maPhong)?.tenPhong ||
                            `Phòng #${booking.maPhong}`}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(booking.ngayDen).toLocaleDateString(
                            "vi-VN",
                          )}
                          <span className="mx-1">→</span>
                          {new Date(booking.ngayDi).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-5 py-4">{booking.soLuongKhach}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="edit"
                              onClick={() => openEdit(booking.id)}
                            >
                              <i className="fa-solid fa-pen-to-square" />
                              Sửa
                            </Button>
                            <Button
                              variant="delete"
                              onClick={() => setDeletingBooking(booking)}
                            >
                              <i className="fa-solid fa-ban" />
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
            ariaLabel="Phân trang đặt phòng"
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </>
      )}

      <Modal
        open={Boolean(editing)}
        title="Cập nhật đặt phòng"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">
              Người dùng
              <select
                className={`${uiClassNames.field} mt-1.5`}
                defaultValue={editing.maNguoiDung}
                name="maNguoiDung"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Phòng
              <select
                className={`${uiClassNames.field} mt-1.5`}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Ngày nhận
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  defaultValue={formatDateForInput(editing.ngayDen)}
                  name="ngayDen"
                  type="date"
                />
              </label>
              <label className="text-sm font-medium">
                Ngày trả
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
        confirmLabel="Hủy đặt phòng"
        description={`Lượt đặt phòng #${deletingBooking?.id ?? ""} sẽ bị hủy khỏi hệ thống. Hành động này không thể hoàn tác.`}
        loading={deleting}
        open={Boolean(deletingBooking)}
        title="Xác nhận hủy đặt phòng"
        onCancel={() => setDeletingBooking(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
