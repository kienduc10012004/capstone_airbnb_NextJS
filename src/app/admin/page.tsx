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
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    textLight: "text-blue-600 dark:text-blue-400",
    description: "Tài khoản đăng ký",
  },
  {
    href: "/admin/locations",
    key: "locations",
    label: "Vị trí",
    icon: "fa-solid fa-location-dot",
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    textLight: "text-emerald-600 dark:text-emerald-400",
    description: "Điểm đến",
  },
  {
    href: "/admin/rooms",
    key: "rooms",
    label: "Phòng thuê",
    icon: "fa-solid fa-bed",
    gradient: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    textLight: "text-rose-600 dark:text-rose-400",
    description: "Phòng đang hoạt động",
  },
  {
    href: "/admin/bookings",
    key: "bookings",
    label: "Đặt phòng",
    icon: "fa-solid fa-calendar-check",
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    textLight: "text-amber-600 dark:text-amber-400",
    description: "Lượt đặt phòng",
  },
] as const;

const quickActions = [
  { href: "/admin/users", icon: "fa-solid fa-user-plus", label: "Thêm người dùng", color: "text-blue-500" },
  { href: "/admin/locations", icon: "fa-solid fa-map-pin", label: "Thêm vị trí", color: "text-emerald-500" },
  { href: "/admin/rooms", icon: "fa-solid fa-plus-circle", label: "Thêm phòng", color: "text-rose-500" },
  { href: "/admin/bookings", icon: "fa-solid fa-calendar-plus", label: "Xem đặt phòng", color: "text-amber-500" },
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
    <div className="space-y-6">
      <AdminPageHeader
        description="Theo dõi nhanh dữ liệu và truy cập các phân hệ quản lý."
        title="Tổng quan hệ thống"
      />

      {error && (
        <div className="mt-4">
          <StatusMessage message={error} type="error" />
        </div>
      )}

      {!stats ? (
        <LoadingState
          className="mt-6"
          label="Đang tổng hợp số liệu..."
          variant="dashboard"
        />
      ) : (
        <>
          {/* 4 Thẻ chỉ số chính - Không dùng boxshadow sáng dưới icon */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardItems.map((item) => (
              <Link
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a2236] border border-gray-200/80 dark:border-white/10 p-6 shadow-sm hover:border-rose-400/50 dark:hover:border-rose-500/30 transition-all duration-200"
                href={item.href}
                key={item.key}
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white`}>
                    <i aria-hidden="true" className={`${item.icon} text-lg`} />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <i className="fa-solid fa-arrow-trend-up text-[9px]" />
                    Hoạt động
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-5">
                  <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums tracking-tight">
                    {stats[item.key].toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-700 dark:text-slate-200">{item.label}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">{item.description}</p>
                </div>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-slate-400 group-hover:text-rose-500 transition-colors">
                  Mở quản lý
                  <i aria-hidden="true" className="fa-solid fa-arrow-right text-[10px]" />
                </div>
              </Link>
            ))}
          </div>

          {/* Hàng 2: Đánh giá + Thao tác nhanh */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Đánh giá */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#1a2236] border border-gray-200/80 dark:border-white/10 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Đánh giá trong hệ thống</p>
                  <p className="mt-2 text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tabular-nums">{stats.comments.toLocaleString()}</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                  <i aria-hidden="true" className="fa-solid fa-star text-2xl" />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Theo dõi đánh giá để nắm bắt chất lượng phòng và trải nghiệm của khách hàng.
              </p>
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-400">
                  <span>Chỉ số hài lòng</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Rất tốt (98%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                </div>
              </div>
            </div>

            {/* Thao tác nhanh */}
            <div className="rounded-2xl bg-white dark:bg-[#1a2236] border border-gray-200/80 dark:border-white/10 p-6 shadow-sm">
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-amber-500" />
                Thao tác nhanh
              </p>
              <div className="space-y-2.5">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/10 p-3 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:border-rose-200 hover:bg-rose-50/50 dark:hover:bg-white/5 dark:hover:text-rose-400 transition-colors group"
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gray-100/80 dark:bg-white/5 ${action.color}`}>
                      <i className={`${action.icon} text-sm`} />
                    </span>
                    <span>{action.label}</span>
                    <i className="fa-solid fa-chevron-right ml-auto text-[10px] text-gray-300 dark:text-slate-600 group-hover:text-rose-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Thanh tổng dữ liệu hệ thống to rõ ràng & nổi bật */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0f1629] via-[#1a2236] to-[#0f1629] p-6 sm:p-7 text-white border border-white/10 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">
                    Tổng dữ liệu hệ thống
                  </p>
                </div>
                <p className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {(stats.users + stats.locations + stats.rooms + stats.bookings + stats.comments).toLocaleString()}{" "}
                  <span className="text-base sm:text-lg font-semibold text-gray-400">bản ghi</span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-8">
                {[
                  { icon: "fa-solid fa-users text-blue-400", label: "Người dùng", value: stats.users },
                  { icon: "fa-solid fa-location-dot text-emerald-400", label: "Vị trí", value: stats.locations },
                  { icon: "fa-solid fa-bed text-rose-400", label: "Phòng thuê", value: stats.rooms },
                  { icon: "fa-solid fa-calendar-check text-amber-400", label: "Đặt phòng", value: stats.bookings },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3.5 border border-white/5 text-left">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
                      <i className={item.icon} />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                      {item.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
