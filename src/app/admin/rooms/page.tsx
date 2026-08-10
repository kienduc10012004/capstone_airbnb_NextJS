"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

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
  createRoom,
  deleteRoom,
  getApiErrorMessage,
  getLocations,
  getRooms,
  updateRoom,
  uploadRoomImage,
  type ApiLocation,
  type ApiRoom,
} from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";
import { roomSchema, type RoomFormData } from "@/app/lib/schemas";
import { getImageSource, getImageValidationMessage } from "@/app/lib/image";
import { useToastStore } from "@/app/store/useToastStore";

const PAGE_SIZE = 12;
const amenityFields = [
  ["wifi", "Wi-Fi"],
  ["dieuHoa", "Điều hòa"],
  ["bep", "Bếp"],
  ["mayGiat", "Máy giặt"],
  ["tivi", "TV"],
  ["doXe", "Đỗ xe"],
  ["hoBoi", "Hồ bơi"],
  ["banLa", "Bàn là"],
  ["banUi", "Bàn ủi"],
] as const;

const emptyRoom: RoomFormData = {
  banLa: false,
  banUi: false,
  bep: false,
  dieuHoa: false,
  doXe: false,
  giaTien: 1,
  giuong: 1,
  hinhAnh: "",
  hoBoi: false,
  khach: 1,
  maViTri: 0,
  mayGiat: false,
  moTa: "",
  phongNgu: 1,
  phongTam: 1,
  tenPhong: "",
  tivi: false,
  wifi: true,
};

export default function AdminRoomsPage() {
  const latestRequestId = useRef(0);
  const showToast = useToastStore((state) => state.showToast);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiRoom | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<ApiRoom | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: emptyRoom,
  });

  //==== Tải danh sách phòng: đồng bộ phân trang và ngăn response cũ ghi đè dữ liệu mới ====
  const loadRooms = async (page: number, searchKeyword = keyword) => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    try {
      const response = await getRooms(page, PAGE_SIZE, searchKeyword);
      if (requestId !== latestRequestId.current) return;
      setRooms(response.content.data);
      setTotalRows(response.content.totalRow);
      setCurrentPage(page);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      setMessage({
        text: getApiErrorMessage(error, "Không thể tải danh sách phòng."),
        type: "error",
      });
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const requestId = ++latestRequestId.current;
    Promise.all([getRooms(1, PAGE_SIZE), getLocations()])
      .then(([roomsResponse, locationsResponse]) => {
        if (!active || requestId !== latestRequestId.current) return;
        setRooms(roomsResponse.content.data);
        setTotalRows(roomsResponse.content.totalRow);
        setLocations(locationsResponse.content);
      })
      .catch(() => {
        if (active && requestId === latestRequestId.current) {
          setMessage({
            text: "Không thể tải dữ liệu quản lý phòng.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (active && requestId === latestRequestId.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  //==== Biểu mẫu phòng: quản lý chế độ thêm, sửa và ảnh minh họa ====
  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    reset(emptyRoom);
    setModalOpen(true);
  };

  const openEdit = (room: ApiRoom) => {
    setEditing(room);
    setImageFile(null);
    setImagePreview(room.hinhAnh);
    reset(room);
    setModalOpen(true);
  };

  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    const validationMessage = getImageValidationMessage(file);
    if (validationMessage) {
      event.target.value = "";
      setImageFile(null);
      setMessage({ text: validationMessage, type: "error" });
      return;
    }
    setMessage(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async (values: RoomFormData) => {
    try {
      const payload = {
        ...values,
        hinhAnh: values.hinhAnh || editing?.hinhAnh || "",
      };
      const response = editing
        ? await updateRoom(editing.id, payload)
        : await createRoom({ ...payload, id: 0 });
      const savedId = editing?.id ?? response.content.id;
      if (imageFile && savedId) {
        await uploadRoomImage(savedId, imageFile);
      }
      setModalOpen(false);
      setMessage(null);
      showToast(editing ? "Đã cập nhật phòng." : "Đã thêm phòng.", "success");
      await loadRooms(currentPage);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể lưu phòng."),
        type: "error",
      });
    }
  };

  //==== Xóa phòng: thực thi yêu cầu sau bước xác nhận và tải lại danh sách ====
  const confirmRemove = async () => {
    if (!deletingRoom) return;

    setDeleting(true);
    try {
      await deleteRoom(deletingRoom.id);
      setMessage(null);
      showToast("Đã xóa phòng.", "success");
      await loadRooms(currentPage);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(
          error,
          "Không thể xóa phòng. Hãy kiểm tra các lượt đặt liên quan.",
        ),
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeletingRoom(null);
    }
  };

  const locationMap = new Map(
    locations.map((location) => [location.id, location]),
  );

  //==== Giao diện quản lý phòng: hiển thị bộ lọc, bảng dữ liệu và biểu mẫu chỉnh sửa ====
  return (
    <div>
      <AdminPageHeader
        action={
          <Button
            className="w-full sm:w-auto"
            variant="create"
            onClick={openCreate}
          >
            + Thêm phòng
          </Button>
        }
        description="Quản lý thông tin, tiện nghi, giá và hình ảnh phòng thuê."
        title="Quản lý phòng thuê"
      />
      <form
        className={`${uiClassNames.surface} mt-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]`}
        onSubmit={(event) => {
          event.preventDefault();
          void loadRooms(1);
        }}
      >
        <input
          className={`${uiClassNames.field} col-span-2 sm:col-span-1`}
          placeholder="Tìm theo tên phòng"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Button className="w-full whitespace-nowrap" type="submit">
          Tìm
        </Button>
        <Button
          className="w-full whitespace-nowrap"
          disabled={!keyword}
          variant="secondary"
          onClick={() => {
            setKeyword("");
            void loadRooms(1, "");
          }}
        >
          Xóa lọc
        </Button>
      </form>
      {message && (
        <div className="mt-5">
          <StatusMessage message={message.text} type={message.type} />
        </div>
      )}
      {loading && rooms.length === 0 ? (
        <LoadingState label="Đang tải phòng..." variant="table" />
      ) : rooms.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Không có phòng phù hợp với bộ lọc hiện tại."
            title="Không có dữ liệu"
          />
        </div>
      ) : (
        <>
          <div
            className={`${uiClassNames.surface} relative mt-6 w-full max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-314px)]`}
          >
            {loading && <LoadingOverlay label="Đang cập nhật phòng..." />}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[900px] text-left text-sm whitespace-nowrap">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Phòng</th>
                    <th className="px-5 py-4">Vị trí</th>
                    <th className="px-5 py-4">Sức chứa</th>
                    <th className="px-5 py-4">Giá</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map((room) => (
                    <tr
                      className="transition-colors duration-300 ease-out hover:bg-gray-50"
                      key={room.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-gray-100">
                            {getImageSource(room.hinhAnh) && (
                              <Image
                                fill
                                alt={room.tenPhong}
                                className="object-cover"
                                sizes="64px"
                                src={getImageSource(room.hinhAnh)!}
                              />
                            )}
                          </div>
                          <div>
                            <p className="max-w-75 truncate font-semibold">
                              {room.tenPhong}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              #{room.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {locationMap.get(room.maViTri)?.tenViTri ||
                          `#${room.maViTri}`}
                      </td>
                      <td className="px-5 py-4">{room.khach} khách</td>
                      <td className="px-5 py-4 font-semibold">
                        ${room.giaTien}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="edit" onClick={() => openEdit(room)}>
                            <i className="fa-solid fa-pen-to-square" />
                            Sửa
                          </Button>
                          <Button
                            variant="delete"
                            onClick={() => setDeletingRoom(room)}
                          >
                            <i className="fa-solid fa-trash" />
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(Math.ceil(totalRows / PAGE_SIZE), 1)}
            onChange={loadRooms}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        size="xl"
        title={editing ? "Cập nhật phòng" : "Thêm phòng"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="space-y-6"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                Tên phòng
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  {...register("tenPhong")}
                />
                {errors.tenPhong && (
                  <span className="text-xs text-red-500">
                    {errors.tenPhong.message}
                  </span>
                )}
              </label>
              <label className="block text-sm font-medium">
                Mô tả
                <textarea
                  className={`${uiClassNames.field} mt-1.5 min-h-28`}
                  {...register("moTa")}
                />
              </label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["khach", "Số khách"],
                  ["phongNgu", "Phòng ngủ"],
                  ["giuong", "Giường"],
                  ["phongTam", "Phòng tắm"],
                  ["giaTien", "Giá / đêm"],
                ].map(([field, label]) => (
                  <label className="text-sm font-medium" key={field}>
                    {label}
                    <input
                      className={`${uiClassNames.field} mt-1.5`}
                      min="0"
                      type="number"
                      {...register(field as keyof RoomFormData, {
                        valueAsNumber: true,
                      })}
                    />
                  </label>
                ))}
                <label className="text-sm font-medium">
                  Vị trí
                  <select
                    className={`${uiClassNames.field} mt-1.5`}
                    {...register("maViTri", { valueAsNumber: true })}
                  >
                    <option value="0">Chọn vị trí</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.tenViTri}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">
                URL hình hiện tại
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  {...register("hinhAnh")}
                />
              </label>
              <label className="mt-4 block text-sm font-medium">
                Tải hình mới
                <input
                  accept="image/*"
                  className={`${uiClassNames.field} mt-1.5`}
                  type="file"
                  onChange={chooseImage}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Chọn hình JPG hoặc PNG có dung lượng dưới 1MB.
                </p>
              </label>
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                {imagePreview ? (
                  <Image
                    fill
                    unoptimized={imagePreview.startsWith("data:")}
                    alt="Xem trước phòng"
                    className="object-cover"
                    src={imagePreview}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-gray-400">
                    Chưa có hình xem trước
                  </div>
                )}
              </div>
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Tiện nghi</legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {amenityFields.map(([field, label]) => (
                <label
                  className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm"
                  key={field}
                >
                  <input type="checkbox" {...register(field)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              loading={isSubmitting}
              type="submit"
              variant={editing ? "edit" : "create"}
            >
              Lưu phòng
            </Button>
          </div>
        </form>
      </Modal>
      <DeleteConfirmDialog
        description={`Phòng "${deletingRoom?.tenPhong ?? ""}" sẽ bị xóa. Hãy bảo đảm phòng không còn lượt đặt liên quan.`}
        loading={deleting}
        open={Boolean(deletingRoom)}
        title="Xóa phòng thuê"
        onCancel={() => setDeletingRoom(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
