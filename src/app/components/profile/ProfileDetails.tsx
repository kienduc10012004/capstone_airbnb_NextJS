"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import Button from "@/app/components/ui/Button";
import LoadingState from "@/app/components/ui/LoadingState";
import StatusMessage from "@/app/components/ui/StatusMessage";
import {
  getApiErrorMessage,
  getUserById,
  updateUser,
  uploadAvatar,
  type ApiUser,
} from "@/app/lib/api";
import { profileSchema, type ProfileFormData } from "@/app/lib/schemas";
import { updateSession } from "@/app/lib/session";
import { getImageSource, getImageValidationMessage } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";
import { formatBirthdayForInput, formatPhoneForInput } from "@/app/lib/user";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

const ProfileDetails = ({ initialUser }: { initialUser: ApiUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.showToast);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      birthday: formatBirthdayForInput(initialUser.birthday),
      email: initialUser.email,
      gender: initialUser.gender ? "true" : "false",
      name: initialUser.name,
      phone: formatPhoneForInput(initialUser.phone),
      role: initialUser.role === "ADMIN" ? "ADMIN" : "USER",
    },
  });

  //==== Tải hồ sơ: lấy dữ liệu người dùng mới nhất và chuẩn hóa giá trị biểu mẫu ====
  useEffect(() => {
    let active = true;
    getUserById(initialUser.id)
      .then((freshUser) => {
        if (!active) return;
        setUser(freshUser);
        reset({
          birthday: formatBirthdayForInput(freshUser.birthday),
          email: freshUser.email,
          gender: freshUser.gender ? "true" : "false",
          name: freshUser.name,
          phone: formatPhoneForInput(freshUser.phone),
          role: freshUser.role === "ADMIN" ? "ADMIN" : "USER",
        });
      })
      .catch(() => {
        if (active) {
          setMessage({
            text: "Đang hiển thị thông tin gần nhất từ phiên đăng nhập.",
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
  }, [initialUser.id, reset]);

  //==== Cập nhật hồ sơ: đồng bộ API, session và store xác thực sau khi lưu ====
  const syncUser = (updatedUser: ApiUser) => {
    setUser(updatedUser);
    setAuthUser(updatedUser);
    updateSession(updatedUser);
  };

  const submit = async (values: ProfileFormData) => {
    setMessage(null);
    try {
      const response = await updateUser(user.id, {
        birthday: values.birthday,
        email: values.email,
        gender: values.gender === "true",
        id: user.id,
        name: values.name,
        phone: values.phone,
        role: user.role,
      });
      syncUser(response.content);
      setMessage(null);
      showToast("Đã cập nhật thông tin hồ sơ.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể cập nhật hồ sơ."),
        type: "error",
      });
    }
  };

  //==== Cập nhật avatar: kiểm tra file dưới 1MB trước khi tải và đồng bộ người dùng ====
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
      syncUser(response.content);
      setMessage(null);
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

  if (loading) {
    return <LoadingState label="Đang tải hồ sơ..." variant="profile" />;
  }
  const avatarSource = getImageSource(user.avatar);

  //==== Giao diện hồ sơ: hiển thị avatar, thông tin cá nhân và trạng thái biểu mẫu ====
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_10px_35px_rgb(15_23_42/0.06)] dark:border-white/10 dark:bg-[#1a2236] dark:shadow-[0_10px_40px_rgb(0_0_0/0.4)]">
      <div className="border-b border-gray-200/70 bg-gradient-to-r from-rose-50 to-pink-50 p-6 dark:border-white/10 dark:from-[#1e293b] dark:to-[#1a2236] sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-900 text-white ring-4 ring-white dark:ring-white/20">
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
          <div className="text-center sm:text-left">
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
              Đổi ảnh đại diện
            </Button>
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
              Chọn hình JPG hoặc PNG có dung lượng dưới 1MB.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-white/80 p-4 shadow-sm sm:mt-0 sm:ml-auto sm:max-w-xs dark:border-emerald-500/20 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <i className="fa-solid fa-shield-check text-base" />
              <span>Xác minh danh tính</span>
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
              Xác minh danh tính của bạn để nhận huy hiệu tin cậy trên Airbnb.
            </p>
            <button
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              type="button"
              onClick={() => showToast("Tài khoản của bạn đã được xác minh danh tính thành công!", "success")}
            >
              <i className="fa-solid fa-circle-check text-xs" />
              <span>Nhận huy hiệu</span>
            </button>
          </div>
        </div>
      </div>

      <form className="space-y-5 bg-white p-6 dark:bg-[#1a2236] sm:p-8" onSubmit={handleSubmit(submit)}>
        {message && (
          <StatusMessage message={message.text} type={message.type} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Họ và tên
            <input
              className={`${uiClassNames.field} mt-1.5 dark:border-white/10 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500 dark:focus:border-rose-500/60`}
              {...register("name")}
            />
            {errors.name && (
              <span className="text-xs text-red-500 dark:text-red-400">
                {errors.name.message}
              </span>
            )}
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Email
            <input
              className={`${uiClassNames.field} mt-1.5 dark:border-white/10 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500 dark:focus:border-rose-500/60`}
              type="email"
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-red-500 dark:text-red-400">
                {errors.email.message}
              </span>
            )}
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Số điện thoại
            <input
              className={`${uiClassNames.field} mt-1.5 dark:border-white/10 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500 dark:focus:border-rose-500/60`}
              {...register("phone")}
            />
            {errors.phone && (
              <span className="text-xs text-red-500 dark:text-red-400">
                {errors.phone.message}
              </span>
            )}
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Ngày sinh
            <input
              className={`${uiClassNames.field} mt-1.5 dark:border-white/10 dark:bg-[#0f172a] dark:text-white dark:focus:border-rose-500/60`}
              type="date"
              {...register("birthday")}
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Giới tính
            <select
              className={`${uiClassNames.field} mt-1.5 dark:border-white/10 dark:bg-[#0f172a] dark:text-white dark:focus:border-rose-500/60`}
              {...register("gender")}
            >
              <option value="true">Nam</option>
              <option value="false">Nữ</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Vai trò
            <input
              className={`${uiClassNames.field} mt-1.5 cursor-not-allowed opacity-60 dark:border-white/10 dark:bg-[#0f172a] dark:text-slate-400`}
              disabled
              value={user.role}
              readOnly
            />
            <input type="hidden" {...register("role")} />
          </label>
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-white/10">
          <Button loading={isSubmitting} type="submit" variant="edit">
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </section>
  );
};

export default ProfileDetails;
