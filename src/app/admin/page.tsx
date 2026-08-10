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

const dashboardItems = [
  {
    href: "/admin/users",
    key: "users",
    label: "Người dùng",
    icon: "fa-solid fa-users",
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-200",
    bgLight: "bg-blue-50",
    textLight: "text-blue-600",
    description: "Tài khoản đăng ký",
  },
  {
    href: "/admin/locations",
    key: "locations",
    label: "Vị trí",
    icon: "fa-solid fa-location-dot",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-200",
    bgLight: "bg-emerald-50",
    textLight: "text-emerald-600",
    description: "Điểm đến",
  },
  {
    href: "/admin/rooms",
    key: "rooms",
    label: "Phòng thuê",
    icon: "fa-solid fa-bed",
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-200",
    bgLight: "bg-rose-50",
    textLight: "text-rose-600",
    description: "Phòng đang hoạt động",
  },
  {
    href: "/admin/bookings",
    key: "bookings",
    label: "Đặt phòng",
    icon: "fa-solid fa-calendar-check",
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-200",
    bgLight: "bg-amber-50",
    textLight: "text-amber-600",
    description: "Lượt đặt phòng",
  },
] as const;

const quickActions = [
  { href: "/admin/users", icon: "fa-solid fa-user-plus", label: "Thêm người dùng", color: "text-blue-600" },
  { href: "/admin/locations", icon: "fa-solid fa-map-pin", label: "Thêm vị trí", color: "text-emerald-600" },
  { href: "/admin/rooms", icon: "fa-solid fa-plus-circle", label: "Thêm phòng", color: "text-rose-600" },
  { href: "/admin/bookings", icon: "fa-solid fa-calendar-plus", label: "Xem đặt phòng", color: "text-amber-600" },
];

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
          {/* Main stat cards */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardItems.map((item) => (
              <Link
                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                href={item.href}
                key={item.key}
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg ${item.shadow} text-white`}>
                    <i aria-hidden="true" className={`${item.icon} text-lg`} />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                    <i className="fa-solid fa-arrow-trend-up text-[9px]" />
                    Hoạt động
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-4">
                  <p className="text-4xl font-bold text-gray-900 tabular-nums">
                    {stats[item.key].toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-rose-500 transition-colors">
                  Mở quản lý
                  <i aria-hidden="true" className="fa-solid fa-arrow-right text-[10px] translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Decorative circle */}
                <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              </Link>
            ))}
          </div>

          {/* Second row: Comments + Quick actions */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* Comments stat - wide card */}
            <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Đánh giá trong hệ thống</p>
                  <p className="mt-2 text-5xl font-bold text-gray-900 tabular-nums">{stats.comments.toLocaleString()}</p>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-200 text-white">
                  <i aria-hidden="true" className="fa-solid fa-star text-2xl" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                Theo dõi đánh giá để nắm bắt chất lượng phòng và trải nghiệm của khách hàng.
              </p>
              {/* Progress bar decoration */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Chỉ số hài lòng</span>
                  <span className="font-semibold text-emerald-600">Tốt</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000" />
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                <i className="fa-solid fa-bolt text-amber-500 mr-2" />
                Thao tác nhanh
              </p>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 group"
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gray-50 group-hover:bg-white ${action.color} transition-colors`}>
                      <i className={`${action.icon} text-sm`} />
                    </span>
                    {action.label}
                    <i className="fa-solid fa-chevron-right ml-auto text-[10px] text-gray-300 group-hover:text-rose-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Summary bar */}
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tổng dữ liệu hệ thống</p>
                <p className="mt-1 text-lg font-bold">
                  {(stats.users + stats.locations + stats.rooms + stats.bookings + stats.comments).toLocaleString()} bản ghi
                </p>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              {[
                { label: "Users", value: stats.users },
                { label: "Vị trí", value: stats.locations },
                { label: "Phòng", value: stats.rooms },
                { label: "Đặt phòng", value: stats.bookings },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-lg font-bold tabular-nums">{item.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
