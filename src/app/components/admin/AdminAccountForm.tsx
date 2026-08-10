"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import Button from "@/app/components/ui/Button";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import LoadingState from "@/app/components/ui/LoadingState";
import StatusMessage from "@/app/components/ui/StatusMessage";
import {
  getApiErrorMessage,
  getUserById,
  updateUser,
  uploadAvatar,
  type ApiUser,
} from "@/app/lib/api";
import { SIGN_IN_EMAIL_STORAGE_KEY } from "@/app/lib/auth-events";
import { getImageSource, getImageValidationMessage } from "@/app/lib/image";
import { profileSchema, type ProfileFormData } from "@/app/lib/schemas";
import { clearSession } from "@/app/lib/session";
import { uiClassNames } from "@/app/lib/styles";
import { formatBirthdayForInput, formatPhoneForInput } from "@/app/lib/user";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

type AdminAccountFormProps = {
  currentUser: ApiUser;
};

const getFormValues = (user: ApiUser): ProfileFormData => ({
  birthday: formatBirthdayForInput(user.birthday),
  email: user.email,
  gender: user.gender ? "true" : "false",
  name: user.name,
  phone: formatPhoneForInput(user.phone),
  role: "ADMIN",
});

const AdminAccountForm = ({ currentUser }: AdminAccountFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useToastStore((state) => state.showToast);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(currentUser);
  const [pendingValues, setPendingValues] = useState<ProfileFormData | null>(
    null,
  );
  const [message, setMessage] = useState<{
    text: string;
    type: "error";
  } | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: getFormValues(currentUser),
  });

  //==== Tải tài khoản Admin: lấy dữ liệu mới nhất và đưa vào biểu mẫu chỉnh sửa ====
  useEffect(() => {
    let active = true;

    getUserById(currentUser.id)
      .then((freshUser) => {
        if (active) {
          setUser(freshUser);
          reset(getFormValues(freshUser));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser.id, reset]);

  //==== Đổi avatar: kiểm tra file dưới 1MB rồi upload ====
  const changeAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationMessage = getImageValidationMessage(file);
    if (validationMessage) {
      setMessage({ text: validationMessage, type: "error" });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const response = await uploadAvatar(file);
      setUser(response.content);
      setAuthUser(response.content);
      showToast("Đã cập nhật ảnh đại diện.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể tải ảnh đại diện."),
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  //==== Lưu tài khoản Admin: cập nhật dữ liệu rồi kết thúc phiên để đăng nhập lại ====
  const confirmSave = async () => {
    if (!pendingValues) return;

    setSaving(true);
    setMessage(null);
    try {
      await updateUser(currentUser.id, {
        birthday: pendingValues.birthday,
        email: pendingValues.email,
        gender: pendingValues.gender === "true",
        id: currentUser.id,
        name: pendingValues.name,
        phone: pendingValues.phone,
        role: "ADMIN",
      });
      window.sessionStorage.setItem(
        SIGN_IN_EMAIL_STORAGE_KEY,
        pendingValues.email,
      );
      showToast("Đã cập nhật tài khoản quản trị.", "success");
      window.setTimeout(() => {
        clearSession();
        window.location.assign("/?auth=signin");
      }, 700);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(
          error,
          "Không thể cập nhật tài khoản quản trị.",
        ),
        type: "error",
      });
      setPendingValues(null);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        label="Đang tải thông tin quản trị viên..."
        variant="profile"
      />
    );
  }

  const avatarSource = getImageSource(user.avatar);

  //==== Giao diện tài khoản Admin: layout giống trang hồ sơ người dùng ====
  return (
    <>
      <AdminPageHeader
        description="Cập nhật thông tin của tài khoản quản trị đang đăng nhập."
        title="Admin của tôi"
      />

      <section className="mt-6 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_35px_rgb(15_23_42/0.06)]">
        {/* Avatar banner */}
        <div className="border-b border-gray-200/70 bg-gradient-to-r from-rose-50 to-pink-50 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            {/* Avatar */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-900 ring-4 ring-white">
              {avatarSource ? (
                <Image
                  fill
                  alt={user.name}
                  className="object-cover"
                  sizes="96px"
                  src={avatarSource}
                />
              ) : (
                <div className="grid h-full place-items-center bg-gradient-to-br from-rose-500 to-pink-600 text-3xl font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + upload btn */}
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
              <input
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={changeAvatar}
              />
              <Button
                className="mt-3"
                loading={uploading}
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fa-solid fa-camera" />
                Đổi ảnh đại diện
              </Button>
              <p className="mt-2 text-xs text-gray-400">
                Chọn hình JPG hoặc PNG có dung lượng dưới 1MB.
              </p>
            </div>

            {/* Admin badge card */}
            <div className="mt-4 rounded-2xl border border-rose-200/80 bg-white/80 p-4 shadow-sm sm:mt-0 sm:ml-auto sm:max-w-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
                <i className="fa-solid fa-shield-halved text-base" />
                <span>Quyền quản trị viên</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Tài khoản của bạn có toàn quyền truy cập và quản lý hệ thống.
              </p>
              <button
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                type="button"
                onClick={() =>
                  showToast(
                    "Tài khoản Admin đã được xác thực và có đầy đủ quyền hạn!",
                    "success",
                  )
                }
              >
                <i className="fa-solid fa-circle-check text-xs" />
                <span>Đã xác thực</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          className="space-y-5 bg-white p-6 sm:p-8"
          onSubmit={handleSubmit((values) => setPendingValues(values))}
        >
          {message && (
            <div className="mb-2">
              <StatusMessage message={message.text} type={message.type} />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Họ và tên
              <input
                className={`${uiClassNames.field} mt-1.5`}
                {...register("name")}
              />
              {errors.name && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700">
              Email đăng nhập
              <input
                autoComplete="email"
                className={`${uiClassNames.field} mt-1.5`}
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700">
              Số điện thoại
              <input
                className={`${uiClassNames.field} mt-1.5`}
                inputMode="numeric"
                {...register("phone")}
              />
              {errors.phone && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.phone.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700">
              Ngày sinh
              <input
                className={`${uiClassNames.field} mt-1.5`}
                type="date"
                {...register("birthday")}
              />
              {errors.birthday && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.birthday.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700">
              Giới tính
              <select
                className={`${uiClassNames.field} mt-1.5`}
                {...register("gender")}
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700">
              Vai trò
              <input
                className={`${uiClassNames.field} mt-1.5 cursor-not-allowed opacity-60`}
                disabled
                readOnly
                value="ADMIN"
              />
              <input type="hidden" value="ADMIN" {...register("role")} />
            </label>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <Button type="submit" variant="edit">
              <i className="fa-solid fa-floppy-disk" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        confirmLabel="Lưu và đăng xuất"
        confirmVariant="edit"
        description="Xác nhận lưu các thay đổi cho tài khoản quản trị?"
        loading={saving}
        open={Boolean(pendingValues)}
        title="Xác nhận cập nhật tài khoản"
        onCancel={() => {
          if (!saving) setPendingValues(null);
        }}
        onConfirm={() => void confirmSave()}
      />
    </>
  );
};

export default AdminAccountForm;
