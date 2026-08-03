"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import BookingHistory from "@/app/components/profile/BookingHistory";
import ProfileDetails from "@/app/components/profile/ProfileDetails";
import LoadingState from "@/app/components/ui/LoadingState";
import { uiClassNames } from "@/app/lib/styles";
import { useAuthStore } from "@/app/store/useAuthStore";

const ProfilePage = () => {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/");
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user) {
    return <LoadingState label="Đang xác thực tài khoản..." />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${uiClassNames.appContainer} flex-1 py-8 sm:py-12`}>
        <div className="mb-8">
          <p className="text-sm font-semibold text-rose-500">Tài khoản</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Quản lý thông tin cá nhân và các chuyến đi đã đặt.
          </p>
        </div>
        <ProfileDetails initialUser={user} />
        <BookingHistory userId={user.id} />
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
