"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import Button from "@/app/components/ui/Button";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import LoadingState from "@/app/components/ui/LoadingState";
import {
  getApiErrorMessage,
  getUserById,
  updateUser,
  uploadAvatar,
  type ApiUser,
} from "@/app/lib/api";
import { getImageSource, getImageValidationMessage } from "@/app/lib/image";
import { profileSchema, type ProfileFormData } from "@/app/lib/schemas";
import { updateSession } from "@/app/lib/session";
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
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(currentUser);
  const [pendingValues, setPendingValues] = useState<ProfileFormData | null>(
    null,
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: getFormValues(currentUser),
  });

  useEffect(() => {
    let active = true;

    getUserById(currentUser.id)
      .then((freshUser) => {
        if (active && freshUser) {
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

  const changeAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationMessage = getImageValidationMessage(file);
    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAvatar(file);
      setUser(response.content);
      setAuthUser(response.content);
      updateSession(response.content);
      showToast("Đã cập nhật ảnh đại diện thành công.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể tải ảnh đại diện."), "error");
    } finally {
      setUploading(false);
    }
  };

  const confirmSave = async () => {
    if (!pendingValues) return;

    setSaving(true);
    const targetUserId = Number(user.id || currentUser.id);

    try {
      const response = await updateUser(targetUserId, {
        birthday: pendingValues.birthday,
        email: pendingValues.email,
        gender: pendingValues.gender === "true",
        id: targetUserId,
        name: pendingValues.name,
        phone: pendingValues.phone,
        role: "ADMIN",
      });

      const updatedUser = response?.content || {
        ...user,
        ...pendingValues,
        gender: pendingValues.gender === "true",
        id: targetUserId,
        role: "ADMIN",
      };

      setUser(updatedUser);
      setAuthUser(updatedUser);
      updateSession(updatedUser);
      reset(getFormValues(updatedUser));
      setIsEditing(false);
      setPendingValues(null);
      showToast("Đã cập nhật thông tin tài khoản quản trị thành công.", "success");
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Không thể cập nhật tài khoản quản trị."),
        "error",
      );
      setPendingValues(null);
    } finally {
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

  return (
    <>
      <AdminPageHeader
        description="Cập nhật thông tin của tài khoản quản trị đang đăng nhập."
        title="Admin của tôi"
      />

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2236] shadow-[0_10px_35px_rgb(15_23_42/0.06)]">
        {/* Avatar banner */}
        <div className="border-b border-gray-200/70 dark:border-white/10 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-slate-800/90 dark:to-slate-900/90 p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex items-center gap-4 sm:gap-0 sm:block">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-900 ring-4 ring-white sm:h-24 sm:w-24">
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
              <div className="sm:hidden">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>

            {/* Name + upload btn (desktop) */}
            <div className="hidden sm:block">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
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

            {/* Upload btn mobile */}
            <div className="flex items-center gap-3 sm:hidden">
              <input
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={changeAvatar}
              />
              <Button
                loading={uploading}
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fa-solid fa-camera" />
                Đổi ảnh
              </Button>
            </div>

            {/* Admin badge card */}
            <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 bg-white/80 dark:bg-emerald-950/40 p-4 shadow-sm sm:ml-auto sm:max-w-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <i className="fa-solid fa-shield-halved text-base" />
                <span>Quyền quản trị viên</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                Tài khoản của bạn có toàn quyền truy cập và quản lý hệ thống.
              </p>
              <button
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
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
          className="space-y-5 bg-white dark:bg-[#1a2236] p-6 sm:p-8"
          onSubmit={handleSubmit((values) => setPendingValues(values))}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Tên tài khoản
              <input
                className={`${uiClassNames.field} mt-1.5 ${!isEditing ? "cursor-default select-none bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300" : ""}`}
                placeholder="VD: nam_nguyen hoặc Nguyễn Văn A"
                readOnly={!isEditing}
                {...register("name")}
              />
              {errors.name && isEditing && (
                <span className="mt-1 block text-xs text-red-500 font-semibold">
                  {errors.name.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Email đăng nhập
              <input
                autoComplete="email"
                className={`${uiClassNames.field} mt-1.5 ${!isEditing ? "cursor-default select-none bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300" : ""}`}
                readOnly={!isEditing}
                type="email"
                {...register("email")}
              />
              {errors.email && isEditing && (
                <span className="mt-1 block text-xs text-red-500 font-semibold">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Số điện thoại
              <input
                className={`${uiClassNames.field} mt-1.5 ${!isEditing ? "cursor-default select-none bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300" : ""}`}
                inputMode="numeric"
                readOnly={!isEditing}
                {...register("phone")}
              />
              {errors.phone && isEditing && (
                <span className="mt-1 block text-xs text-red-500 font-semibold">
                  {errors.phone.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Ngày sinh
              <input
                className={`${uiClassNames.field} mt-1.5 ${!isEditing ? "cursor-default select-none bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 [color-scheme:light_dark]" : ""}`}
                readOnly={!isEditing}
                type="date"
                {...register("birthday")}
              />
              {errors.birthday && isEditing && (
                <span className="mt-1 block text-xs text-red-500 font-semibold">
                  {errors.birthday.message}
                </span>
              )}
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Giới tính
              <select
                className={`${uiClassNames.field} mt-1.5 ${!isEditing ? "cursor-default bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300" : ""}`}
                disabled={!isEditing}
                {...register("gender")}
              >
                <option value="true" className="dark:bg-slate-800 text-gray-900 dark:text-white">Nam</option>
                <option value="false" className="dark:bg-slate-800 text-gray-900 dark:text-white">Nữ</option>
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Vai trò
              <input
                className={`${uiClassNames.field} mt-1.5 cursor-not-allowed bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 opacity-60`}
                disabled
                readOnly
                value="ADMIN"
              />
              <input type="hidden" value="ADMIN" {...register("role")} />
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-4">
            {isEditing ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                <i className="fa-solid fa-triangle-exclamation mr-1" />
                Đang ở chế độ chỉnh sửa
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-400">
                Bấm “Cập nhật thông tin” để chỉnh sửa
              </p>
            )}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      reset(getFormValues(user));
                      setIsEditing(false);
                    }}
                  >
                    <i className="fa-solid fa-xmark" />
                    Hủy
                  </Button>
                  <Button type="submit" variant="edit">
                    <i className="fa-solid fa-floppy-disk" />
                    Lưu thay đổi
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="edit"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fa-solid fa-pen-to-square" />
                  Cập nhật thông tin
                </Button>
              )}
            </div>
          </div>
        </form>
      </section>

      <ConfirmDialog
        confirmLabel="Lưu thay đổi"
        confirmVariant="edit"
        description="Xác nhận lưu các thông tin chỉnh sửa cho tài khoản quản trị?"
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
