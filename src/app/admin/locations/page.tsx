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
  createLocation,
  deleteLocation,
  getApiErrorMessage,
  getLocationsPaged,
  updateLocation,
  uploadLocationImage,
  type ApiLocation,
} from "@/app/lib/api";
import { locationSchema, type LocationFormData } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { getImageSource, getImageValidationMessage } from "@/app/lib/image";
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
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: emptyForm,
  });

  //==== Tải danh sách vị trí: đồng bộ phân trang, tìm kiếm và trạng thái loading ====
  const loadLocations = async (page: number, searchKeyword = keyword) => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    try {
      const response = await getLocationsPaged({
        keyword: searchKeyword || undefined,
        pageIndex: page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== latestRequestId.current) return;
      setLocations(response.content.data);
      setTotalRows(response.content.totalRow);
      setCurrentPage(page);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      setMessage({
        text: getApiErrorMessage(error, "Không thể tải danh sách vị trí."),
        type: "error",
      });
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
          setMessage({
            text: "Không thể tải danh sách vị trí.",
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

  //==== Biểu mẫu vị trí: quản lý dữ liệu thêm, sửa và ảnh đại diện ====
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
    setImagePreview(location.hinhAnh);
    reset({
      hinhAnh: location.hinhAnh,
      quocGia: location.quocGia,
      tenViTri: location.tenViTri,
      tinhThanh: location.tinhThanh,
    });
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

  const submit = async (values: LocationFormData) => {
    setMessage(null);
    try {
      const payload = {
        hinhAnh: values.hinhAnh || editing?.hinhAnh || "",
        quocGia: values.quocGia,
        tenViTri: values.tenViTri,
        tinhThanh: values.tinhThanh,
      };
      const response = editing
        ? await updateLocation(editing.id, payload)
        : await createLocation({ ...payload, id: 0 });
      const savedId = editing?.id ?? response.content.id;
      if (imageFile && savedId) {
        await uploadLocationImage(savedId, imageFile);
      }
      setModalOpen(false);
      setMessage(null);
      if (editing) {
        showToast("Đã cập nhật vị trí.", "success");
      } else {
        showToast("Đã thêm vị trí.", "success");
      }
      await loadLocations(currentPage);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể lưu vị trí."),
        type: "error",
      });
    }
  };

  //==== Xóa vị trí: thực thi yêu cầu sau bước xác nhận và làm mới dữ liệu ====
  const confirmRemove = async () => {
    if (!deletingLocation) return;

    setDeleting(true);
    try {
      await deleteLocation(deletingLocation.id);
      setMessage(null);
      showToast("Đã xóa vị trí.", "success");
      await loadLocations(currentPage);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(
          error,
          "Không thể xóa vị trí. Hãy kiểm tra các phòng liên quan.",
        ),
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeletingLocation(null);
    }
  };

  //==== Giao diện quản lý vị trí: hiển thị bộ lọc, danh sách và các hộp thoại ====
  return (
    <div>
      <AdminPageHeader
        action={
          <Button
            className="w-full sm:w-auto"
            variant="create"
            onClick={openCreate}
          >
            + Thêm vị trí
          </Button>
        }
        description="Quản lý điểm đến, tỉnh thành và hình ảnh đại diện."
        title="Quản lý vị trí"
      />
      <form
        className={`${uiClassNames.surface} mt-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]`}
        onSubmit={(event) => {
          event.preventDefault();
          void loadLocations(1);
        }}
      >
        <input
          className={`${uiClassNames.field} col-span-2 sm:col-span-1`}
          placeholder="Tìm vị trí hoặc tỉnh thành"
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
            void loadLocations(1, "");
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
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {locations.map((location) => (
                <article
                  className={`${uiClassNames.surface} group overflow-hidden`}
                  key={location.id}
                >
                  <div
                    className={`relative h-44 overflow-hidden bg-gray-100 ${uiClassNames.locationImageSweep}`}
                  >
                    {getImageSource(location.hinhAnh) ? (
                      <Image
                        fill
                        alt={location.tenViTri}
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        src={getImageSource(location.hinhAnh)!}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl text-rose-300">
                        ⌖
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{location.tenViTri}</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          {location.tinhThanh}, {location.quocGia}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        #{location.id}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="edit" onClick={() => openEdit(location)}>
                        <i className="fa-solid fa-pen-to-square" />
                        Sửa
                      </Button>
                      <Button
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

      <Modal
        open={modalOpen}
        size="lg"
        title={editing ? "Cập nhật vị trí" : "Thêm vị trí"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                Tên vị trí
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  {...register("tenViTri")}
                />
                {errors.tenViTri && (
                  <span className="text-xs text-red-500">
                    {errors.tenViTri.message}
                  </span>
                )}
              </label>
              <label className="block text-sm font-medium">
                Tỉnh thành
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  {...register("tinhThanh")}
                />
              </label>
              <label className="block text-sm font-medium">
                Quốc gia
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  {...register("quocGia")}
                />
              </label>
              <label className="block text-sm font-medium">
                URL hình hiện tại
                <input
                  className={`${uiClassNames.field} mt-1.5`}
                  {...register("hinhAnh")}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium">
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
              <div
                className={`group relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 ${uiClassNames.locationImageSweep}`}
              >
                {imagePreview ? (
                  <Image
                    fill
                    unoptimized={imagePreview.startsWith("data:")}
                    alt="Xem trước vị trí"
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              loading={isSubmitting}
              type="submit"
              variant={editing ? "edit" : "create"}
            >
              Lưu vị trí
            </Button>
          </div>
        </form>
      </Modal>
      <DeleteConfirmDialog
        description={`Vị trí "${deletingLocation?.tenViTri ?? ""}" sẽ bị xóa. Các phòng đang liên kết có thể khiến thao tác thất bại.`}
        loading={deleting}
        open={Boolean(deletingLocation)}
        title="Xóa vị trí"
        onCancel={() => setDeletingLocation(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
