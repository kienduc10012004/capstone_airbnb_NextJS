"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSearchBar from "@/app/components/admin/AdminSearchBar";
import DualImagePicker from "@/app/components/admin/DualImagePicker";
import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import Modal from "@/app/components/ui/Modal";
import Pagination from "@/app/components/ui/Pagination";
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
import { getImageSource } from "@/app/lib/image";
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

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: emptyRoom,
  });

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
      showToast(getApiErrorMessage(error, "Không thể tải danh sách phòng."), "error");
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const requestId = ++latestRequestId.current;
    Promise.all([
      getRooms(1, PAGE_SIZE),
      getLocations(),
    ])
      .then(([roomsResponse, locationsResponse]) => {
        if (!active || requestId !== latestRequestId.current) return;
        setRooms(roomsResponse.content.data);
        setTotalRows(roomsResponse.content.totalRow);
        setLocations(locationsResponse.content);
      })
      .catch(() => {
        if (active && requestId === latestRequestId.current) {
          showToast("Không thể tải dữ liệu phòng.", "error");
        }
      })
      .finally(() => {
        if (active && requestId === latestRequestId.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const locationMap = new Map(
    locations.map((location) => [location.id, location]),
  );

  const handleSearchChange = (val: string) => {
    setKeyword(val);
    void loadRooms(1, val);
  };

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
    setImagePreview(room.hinhAnh || "");
    reset({
      banLa: room.banLa,
      banUi: room.banUi,
      bep: room.bep,
      dieuHoa: room.dieuHoa,
      doXe: room.doXe,
      giaTien: room.giaTien,
      giuong: room.giuong,
      hinhAnh: room.hinhAnh || "",
      hoBoi: room.hoBoi,
      khach: room.khach,
      maViTri: room.maViTri,
      mayGiat: room.mayGiat,
      moTa: room.moTa,
      phongNgu: room.phongNgu,
      phongTam: room.phongTam,
      tenPhong: room.tenPhong,
      tivi: room.tivi,
      wifi: room.wifi,
    });
    setModalOpen(true);
  };

  const handleFileSelect = (file: File | null, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setValue("hinhAnh", preview);
  };

  const handleUrlChange = (url: string) => {
    setImageFile(null);
    setImagePreview(url);
    setValue("hinhAnh", url);
  };

  const submit = async (values: RoomFormData) => {
    try {
      let savedRoomId = editing?.id;
      const effectiveImage = imagePreview || values.hinhAnh || "";

      if (editing) {
        await updateRoom(editing.id, {
          ...values,
          hinhAnh: effectiveImage,
          id: editing.id,
        });
        showToast("Đã cập nhật phòng thành công.", "success");
      } else {
        const response = await createRoom({
          ...values,
          hinhAnh: effectiveImage,
        });
        savedRoomId = response.content.id;
        showToast("Đã thêm phòng mới thành công.", "success");
      }

      if (imageFile && savedRoomId) {
        await uploadRoomImage(savedRoomId, imageFile);
      }

      setModalOpen(false);
      await loadRooms(currentPage);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể lưu thông tin phòng."), "error");
    }
  };

  const confirmRemove = async () => {
    if (!deletingRoom) return;
    setDeleting(true);
    try {
      await deleteRoom(deletingRoom.id);
      showToast(`Đã xóa phòng "${deletingRoom.tenPhong}" thành công.`, "success");
      await loadRooms(currentPage);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể xóa phòng."), "error");
    } finally {
      setDeleting(false);
      setDeletingRoom(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        action={
          <Button
            className="w-full sm:w-auto font-bold shadow-md"
            variant="create"
            onClick={openCreate}
          >
            <i className="fa-solid fa-plus-circle mr-1" />
            Thêm phòng
          </Button>
        }
        description="Quản lý danh sách phòng thuê, tiện nghi và giá niêm yết."
        title="Quản lý phòng thuê"
      />

      {/* Thanh tìm kiếm Debouncing */}
      <AdminSearchBar
        placeholder="Tìm kiếm theo tên phòng..."
        value={keyword}
        onChange={handleSearchChange}
      />

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
            className={`${uiClassNames.adminCard} relative mt-6 w-full max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-330px)]`}
          >
            {loading && <LoadingOverlay label="Đang cập nhật phòng..." />}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[900px] text-left text-sm whitespace-nowrap">
                <thead className={uiClassNames.adminTableHead}>
                  <tr>
                    <th className="px-5 py-4">Phòng</th>
                    <th className="px-5 py-4">Vị trí</th>
                    <th className="px-5 py-4">Sức chứa</th>
                    <th className="px-5 py-4">Giá</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {rooms.map((room) => (
                    <tr
                      className={uiClassNames.adminTableRow}
                      key={room.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
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
                            <p className="max-w-72 truncate font-semibold text-gray-900 dark:text-white">
                              {room.tenPhong}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500 font-mono">
                              #{room.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-slate-300">
                        {locationMap.get(room.maViTri)?.tenViTri ||
                          `#${room.maViTri}`}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800 dark:text-slate-200">
                        {room.khach} khách
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                        ${room.giaTien}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            className="min-w-[68px] text-xs font-bold py-1.5 justify-center"
                            variant="edit"
                            onClick={() => openEdit(room)}
                          >
                            <i className="fa-solid fa-pen-to-square" />
                            Sửa
                          </Button>
                          <Button
                            className="min-w-[68px] text-xs font-bold py-1.5 justify-center"
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

      {/* Modal Thêm / Sửa phòng */}
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                Tên phòng <span className="text-rose-500">*</span>
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  placeholder="VD: Căn hộ cao cấp view biển"
                  {...register("tenPhong")}
                />
                {errors.tenPhong && (
                  <span className="block mt-1 text-xs font-semibold text-red-500">
                    {errors.tenPhong.message}
                  </span>
                )}
              </label>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
                Mô tả <span className="text-rose-500">*</span>
                <textarea
                  className={`${uiClassNames.field} mt-1.5 min-h-28`}
                  placeholder="Mô tả chi tiết phòng..."
                  {...register("moTa")}
                />
              </label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["khach", "Số khách"],
                  ["phongNgu", "Phòng ngủ"],
                  ["giuong", "Giường"],
                  ["phongTam", "Phòng tắm"],
                  ["giaTien", "Giá / đêm ($)"],
                ].map(([field, label]) => (
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-200" key={field}>
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
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Vị trí <span className="text-rose-500">*</span>
                  <select
                    className={`${uiClassNames.field} mt-1.5 cursor-pointer`}
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

            <div className="space-y-4">
              {/* Chọn 2 kiểu ảnh cho phòng */}
              <DualImagePicker
                previewUrl={imagePreview}
                onError={(msg) => showToast(msg, "error")}
                onFileSelect={handleFileSelect}
                onUrlChange={handleUrlChange}
              />

              <div>
                <span className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  Tiện nghi phòng
                </span>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/50 dark:bg-slate-800/50">
                  {amenityFields.map(([field, label]) => (
                    <label
                      className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer"
                      key={field}
                    >
                      <input
                        className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        type="checkbox"
                        {...register(field)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="font-bold shadow-md"
              loading={isSubmitting}
              type="submit"
              variant={editing ? "edit" : "create"}
            >
              {editing ? "Cập nhật phòng" : "Lưu phòng"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Xác nhận xóa phòng có đếm ngược 5 giây */}
      <DeleteConfirmDialog
        countdownSeconds={5}
        description={`Phòng "${deletingRoom?.tenPhong ?? ""}" sẽ bị xóa khỏi hệ thống. Vui lòng chờ 5 giây để xác nhận thao tác.`}
        loading={deleting}
        open={Boolean(deletingRoom)}
        title="Xác nhận xóa phòng"
        onCancel={() => setDeletingRoom(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
