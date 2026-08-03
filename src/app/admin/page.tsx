"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import LoadingState from "@/app/components/ui/LoadingState";
import StatusMessage from "@/app/components/ui/StatusMessage";
import {
  getAllRooms,
  getBookings,
  getComments,
  getLocations,
  getUsers,
} from "@/app/lib/api";
import { uiClassNames } from "@/app/lib/styles";

const dashboardItems = [
  {
    href: "/admin/users",
    key: "users",
    label: "Người dùng",
    tone: "from-blue-500 to-indigo-600",
  },
  {
    href: "/admin/locations",
    key: "locations",
    label: "Vị trí",
    tone: "from-emerald-500 to-teal-600",
  },
  {
    href: "/admin/rooms",
    key: "rooms",
    label: "Phòng thuê",
    tone: "from-rose-500 to-pink-600",
  },
  {
    href: "/admin/bookings",
    key: "bookings",
    label: "Đặt phòng",
    tone: "from-amber-500 to-orange-600",
  },
] as const;

type DashboardStats = {
  bookings: number;
  comments: number;
  locations: number;
  rooms: number;
  users: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getUsers(),
      getLocations(),
      getAllRooms(),
      getBookings(),
      getComments(),
    ])
      .then(([users, locations, rooms, bookings, comments]) => {
        if (!active) return;
        setStats({
          bookings: bookings.content.length,
          comments: comments.content.length,
          locations: locations.content.length,
          rooms: rooms.content.length,
          users: users.content.length,
        });
      })
      .catch(() => {
        if (active) setError("Không thể tải toàn bộ số liệu tổng quan.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <AdminPageHeader
        description="Theo dõi nhanh dữ liệu và truy cập các phân hệ quản lý."
        title="Tổng quan hệ thống"
      />
      {error && (
        <div className="mt-6">
          <StatusMessage message={error} type="error" />
        </div>
      )}
      {!stats ? (
        <LoadingState
          className="mt-8"
          label="Đang tổng hợp số liệu..."
          variant="dashboard"
        />
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardItems.map((item) => (
              <Link
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${item.tone}`}
                href={item.href}
                key={item.key}
              >
                <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/15" />
                <p className="text-sm text-white/80">{item.label}</p>
                <p className="mt-3 text-4xl font-bold">{stats[item.key]}</p>
                <p className="mt-5 text-xs font-semibold text-white/80">
                  Mở quản lý
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-chevron-right ml-1"
                  />
                </p>
              </Link>
            ))}
          </div>
          <div className={`${uiClassNames.surface} mt-6 p-6`}>
            <p className="text-sm text-gray-500">Đánh giá trong hệ thống</p>
            <p className="mt-2 text-3xl font-semibold">{stats.comments}</p>
            <p className="mt-2 text-sm text-gray-500">
              Theo dõi đánh giá để nắm bắt chất lượng phòng và trải nghiệm của
              khách hàng.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
