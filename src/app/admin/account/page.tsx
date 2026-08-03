"use client";

import AdminAccountForm from "@/app/components/admin/AdminAccountForm";
import LoadingState from "@/app/components/ui/LoadingState";
import { useAuthStore } from "@/app/store/useAuthStore";

export default function AdminAccountPage() {
  const currentUser = useAuthStore((state) => state.user);

  if (!currentUser) {
    return <LoadingState label="Đang xác thực tài khoản quản trị..." />;
  }

  return <AdminAccountForm currentUser={currentUser} />;
}
