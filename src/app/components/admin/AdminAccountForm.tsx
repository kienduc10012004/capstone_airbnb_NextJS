"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
  type ApiUser,
} from "@/app/lib/api";
import { SIGN_IN_EMAIL_STORAGE_KEY } from "@/app/lib/auth-events";
import { profileSchema, type ProfileFormData } from "@/app/lib/schemas";
import { clearSession } from "@/app/lib/session";
import { uiClassNames } from "@/app/lib/styles";
import { formatBirthdayForInput, formatPhoneForInput } from "@/app/lib/user";
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
  const showToast = useToastStore((state) => state.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if (active) reset(getFormValues(freshUser));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser.id, reset]);

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

  //==== Giao diện tài khoản Admin: hiển thị biểu mẫu và hộp thoại xác nhận lưu ====
  return (
    <>
      <AdminPageHeader
        description="Cập nhật thông tin của tài khoản quản trị đang đăng nhập."
        title="Admin của tôi"
      />

      <section className={`${uiClassNames.surface} mt-6 max-w-4xl p-5 sm:p-7`}>
        {message && (
          <div className="mb-5">
            <StatusMessage message={message.text} type={message.type} />
          </div>
        )}

        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) => setPendingValues(values))}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">
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

            <label className="text-sm font-medium">
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

            <label className="text-sm font-medium">
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

            <label className="text-sm font-medium">
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

            <label className="text-sm font-medium">
              Giới tính
              <select
                className={`${uiClassNames.field} mt-1.5`}
                {...register("gender")}
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Vai trò
              <input
                className={`${uiClassNames.field} mt-1.5`}
                disabled
                readOnly
                value="ADMIN"
              />
              <input type="hidden" value="ADMIN" {...register("role")} />
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="edit">
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
