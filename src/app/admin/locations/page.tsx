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
  createLocation,
  deleteLocation,
  getApiErrorMessage,
  getLocations,
  getLocationsPaged,
  updateLocation,
  uploadLocationImage,
  type ApiLocation,
} from "@/app/lib/api";
import { normalizeVietnameseSearch } from "@/app/components/search/date-utils";
import { locationSchema, type LocationFormData } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { getImageSource } from "@/app/lib/image";
import { useToastStore } from "@/app/store/useToastStore";

const PAGE_SIZE = 12;
const emptyForm: LocationFormData = {
  hinhAnh: "",
  quocGia: "Việt Nam",
  tenViTri: "",
  tinhThanh: "",
};

export default function AdminLocationsPage() {
  const latestRequestId = useRef(0);
  const showToast = useToastStore((state) => state.showToast);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<ApiLocation | null>(
    null,
  );
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
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: emptyForm,
  });

  const loadLocations = async (page: number, searchKeyword = keyword) => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    try {
      const response = await getLocationsPaged({
        keyword: searchKeyword || undefined,
        pageIndex: page,
        pageSize: PAGE_SIZE,
      });

      let pageData = response.content.data;
      let totalCount = response.content.totalRow;

      // Fallback cho từ khóa không dấu (vd: "hon rua")
      if (pageData.length === 0 && searchKeyword.trim()) {
        const allRes = await getLocations();
        const normKey = normalizeVietnameseSearch(searchKeyword);
        const filtered = (allRes.content || []).filter((loc) => {
          const ten = normalizeVietnameseSearch(loc.tenViTri);
          const tinh = normalizeVietnameseSearch(loc.tinhThanh);
          const quoc = normalizeVietnameseSearch(loc.quocGia);
          return (
            ten.includes(normKey) ||
            tinh.includes(normKey) ||
            quoc.includes(normKey)
          );
        });
        totalCount = filtered.length;
        const start = (page - 1) * PAGE_SIZE;
        pageData = filtered.slice(start, start + PAGE_SIZE);
      }

      if (requestId !== latestRequestId.current) return;
      setLocations(pageData);
      setTotalRows(totalCount);
      setCurrentPage(page);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      showToast(getApiErrorMessage(error, "Không thể tải danh sách vị trí."), "error");
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const requestId = ++latestRequestId.current;
    getLocationsPaged({ pageIndex: 1, pageSize: PAGE_SIZE })
      .then((response) => {
        if (!active || requestId !== latestRequestId.current) return;
        setLocations(response.content.data);
        setTotalRows(response.content.totalRow);
      })
      .catch(() => {
        if (active && requestId === latestRequestId.current) {
          showToast("Không thể tải danh sách vị trí.", "error");
        }
      })
      .finally(() => {
        if (active && requestId === latestRequestId.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const handleSearchChange = (val: string) => {
    setKeyword(val);
    void loadLocations(1, val);
  };

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    reset(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (location: ApiLocation) => {
    setEditing(location);
    setImageFile(null);
    setImagePreview(location.hinhAnh || "");
    reset({
      hinhAnh: location.hinhAnh || "",
      quocGia: location.quocGia,
      tenViTri: location.tenViTri,
      tinhThanh: location.tinhThanh,
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

  const submit = async (values: LocationFormData) => {
    try {
      let savedLocationId = editing?.id;
      const effectiveImage = imagePreview || values.hinhAnh || "";

      if (editing) {
        await updateLocation(editing.id, {
          ...values,
          hinhAnh: effectiveImage,
          id: editing.id,
        });
        showToast("Đã cập nhật vị trí thành công.", "success");
      } else {
        const response = await createLocation({
          ...values,
          hinhAnh: effectiveImage,
        });
        savedLocationId = response.content.id;
        showToast("Đã tạo vị trí mới thành công.", "success");
      }

      if (imageFile && savedLocationId) {
        await uploadLocationImage(savedLocationId, imageFile);
      }

      setModalOpen(false);
      await loadLocations(currentPage);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể lưu thông tin vị trí."), "error");
    }
  };

  const confirmRemove = async () => {
    if (!deletingLocation) return;
    setDeleting(true);
    try {
      await deleteLocation(deletingLocation.id);
      showToast(`Đã xóa vị trí "${deletingLocation.tenViTri}" thành công.`, "success");
      await loadLocations(currentPage);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể xóa vị trí."), "error");
    } finally {
      setDeleting(false);
      setDeletingLocation(null);
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
            <i className="fa-solid fa-map-pin mr-1" />
            Thêm vị trí
          </Button>
        }
        description="Quản lý điểm đến, tỉnh thành và hình ảnh đại diện."
        title="Quản lý vị trí"
      />

      {/* Thanh tìm kiếm Debouncing tự động */}
      <AdminSearchBar
        placeholder="Tìm kiếm vị trí hoặc tỉnh thành..."
        value={keyword}
        onChange={handleSearchChange}
      />

      {loading && locations.length === 0 ? (
        <LoadingState label="Đang tải vị trí..." variant="cards" />
      ) : locations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Chưa có vị trí phù hợp với bộ lọc."
            title="Không có dữ liệu"
          />
        </div>
      ) : (
        <>
          <div className="relative mt-6">
            {loading && <LoadingOverlay label="Đang cập nhật vị trí..." />}
            {/* Hiển thị 4 items / row trên Desktop (xl:grid-cols-4) */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {locations.map((location) => (
                <article
                  className={`${uiClassNames.adminCard} group overflow-hidden flex flex-col hover:border-rose-400/50 dark:hover:border-rose-500/30 transition-all`}
                  key={location.id}
                >
                  <div
                    className={`relative h-44 overflow-hidden bg-gray-100 dark:bg-slate-800 ${uiClassNames.locationImageSweep}`}
                  >
                    {getImageSource(location.hinhAnh) ? (
                      <Image
                        fill
                        alt={location.tenViTri}
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                        src={getImageSource(location.hinhAnh)!}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl text-rose-300">
                        ⌖
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h2 className="font-bold text-gray-900 dark:text-white text-base leading-snug truncate">
                          {location.tenViTri}
                        </h2>
                        <span className="text-xs font-mono font-semibold text-gray-400 dark:text-slate-500 shrink-0">
                          #{location.id}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        {location.tinhThanh}, {location.quocGia}
                      </p>
                    </div>

                    {/* 2 Nút Sửa và Xóa cân đối, đẹp mắt */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                      <Button
                        className="w-full text-xs font-bold py-2 justify-center"
                        variant="edit"
                        onClick={() => openEdit(location)}
                      >
                        <i className="fa-solid fa-pen-to-square" />
                        Sửa
                      </Button>
                      <Button
                        className="w-full text-xs font-bold py-2 justify-center"
                        variant="delete"
                        onClick={() => setDeletingLocation(location)}
                      >
                        <i className="fa-solid fa-trash" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(Math.ceil(totalRows / PAGE_SIZE), 1)}
            onChange={loadLocations}
          />
        </>
      )}

      {/* Modal Thêm / Sửa vị trí với 2 kiểu chọn ảnh */}
      <Modal
        open={modalOpen}
        title={editing ? "Cập nhật vị trí" : "Thêm vị trí"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
            Tên vị trí <span className="text-rose-500">*</span>
            <input
              className={`${uiClassNames.field} mt-1.5`}
              placeholder="VD: Quận 1, Bến Nghé"
              {...register("tenViTri")}
            />
            {errors.tenViTri && (
              <span className="block mt-1 text-xs font-semibold text-red-500">
                {errors.tenViTri.message}
              </span>
            )}
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Tỉnh thành <span className="text-rose-500">*</span>
              <input
                className={`${uiClassNames.field} mt-1.5`}
                placeholder="VD: Hồ Chí Minh"
                {...register("tinhThanh")}
              />
              {errors.tinhThanh && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.tinhThanh.message}
                </span>
              )}
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Quốc gia <span className="text-rose-500">*</span>
              <input
                className={`${uiClassNames.field} mt-1.5`}
                placeholder="VD: Việt Nam"
                {...register("quocGia")}
              />
              {errors.quocGia && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.quocGia.message}
                </span>
              )}
            </label>
          </div>

          {/* Chọn 2 kiểu ảnh: Upload file hoặc Nhập link URL */}
          <DualImagePicker
            previewUrl={imagePreview}
            onError={(msg) => showToast(msg, "error")}
            onFileSelect={handleFileSelect}
            onUrlChange={handleUrlChange}
          />

          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="font-bold shadow-md"
              loading={isSubmitting}
              type="submit"
              variant={editing ? "edit" : "create"}
            >
              {editing ? "Cập nhật vị trí" : "Lưu vị trí"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Xác nhận xóa có đếm ngược 5 giây */}
      <DeleteConfirmDialog
        countdownSeconds={5}
        description={`Vị trí "${deletingLocation?.tenViTri ?? ""}" sẽ bị xóa khỏi hệ thống. Vui lòng chờ 5 giây để xác nhận thao tác.`}
        loading={deleting}
        open={Boolean(deletingLocation)}
        title="Xác nhận xóa vị trí"
        onCancel={() => setDeletingLocation(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
