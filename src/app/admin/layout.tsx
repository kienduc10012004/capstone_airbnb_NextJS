"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminMobileMenu from "@/app/components/admin/AdminMobileMenu";
import LoadingState from "@/app/components/ui/LoadingState";
import { useAuthStore } from "@/app/store/useAuthStore";

const adminNavMenu = [
  { href: "/admin", icon: "fa-solid fa-chart-pie", label: "Tổng quan" },
  {
    href: "/admin/account",
    icon: "fa-solid fa-user-shield",
    label: "Admin của tôi",
  },
  { href: "/admin/users", icon: "fa-solid fa-users", label: "Người dùng" },
  {
    href: "/admin/locations",
    icon: "fa-solid fa-location-dot",
    label: "Vị trí",
  },
  { href: "/admin/rooms", icon: "fa-solid fa-bed", label: "Phòng thuê" },
  {
    href: "/admin/bookings",
    icon: "fa-solid fa-calendar-check",
    label: "Đặt phòng",
  },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (hydrated && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [hydrated, router, user]);

  useEffect(() => {
    const closeMenuAfterNavigation = window.setTimeout(
      () => setMobileMenuOpen(false),
      0,
    );
    return () => window.clearTimeout(closeMenuAfterNavigation);
  }, [pathname]);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
    const closeMenuOnDesktop = () => {
      if (desktopMediaQuery.matches) setMobileMenuOpen(false);
    };

    desktopMediaQuery.addEventListener("change", closeMenuOnDesktop);
    return () =>
      desktopMediaQuery.removeEventListener("change", closeMenuOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (!hydrated || user?.role !== "ADMIN") {
    return <LoadingState label="Đang xác thực quyền quản trị..." />;
  }

  // Get active page label for breadcrumb
  const activeNav = adminNavMenu.find((item) =>
    item.href === "/admin"
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );

  return (
    <div className="min-h-screen bg-[#f0f2f7] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 z-50 border-b border-gray-800/50 bg-[#0f1629] text-white lg:h-screen lg:border-r lg:border-b-0 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 lg:px-6 lg:py-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30 text-white font-bold text-lg">
              A
            </span>
            <div>
              <span className="block font-bold text-white text-sm leading-tight">Airbnb</span>
              <span className="block text-[11px] text-rose-400 font-semibold tracking-wider uppercase">Admin Portal</span>
            </div>
          </Link>

          {/* Mobile menu toggle */}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={
              mobileMenuOpen ? "Đóng menu quản trị" : "Mở menu quản trị"
            }
            className={`relative z-50 grid h-10 w-10 cursor-pointer place-items-center rounded-xl border text-base shadow-sm transition-all duration-300 lg:hidden ${
              mobileMenuOpen
                ? "border-rose-400 bg-rose-500/10 text-rose-400"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-rose-400/50 hover:text-rose-400"
            }`}
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <i
              aria-hidden="true"
              className={
                mobileMenuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"
              }
            />
          </button>
        </div>

        {/* Admin info box */}
        <div className="hidden lg:block mx-4 mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-sm font-bold shadow-md">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>

        {/* Nav section label */}
        <div className="hidden lg:block px-6 mb-2">
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Menu</p>
        </div>

        {/* Navigation */}
        <nav className="hidden space-y-1 px-3 lg:block flex-1">
          {adminNavMenu.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                className={`flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25"
                    : "text-gray-400 hover:bg-white/[0.07] hover:text-white"
                }`}
                href={item.href}
                key={item.href}
              >
                <i aria-hidden="true" className={`${item.icon} w-4 text-base`} />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="hidden border-t border-white/[0.07] p-4 lg:block mt-auto">
          <Link
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            href="/"
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left text-xs" />
            Về trang người dùng
          </Link>
        </div>
      </aside>

      {/* Mobile menu */}
      <AdminMobileMenu
        email={user.email}
        navigationItems={adminNavMenu}
        open={mobileMenuOpen}
        pathname={pathname}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
              <i className="fa-solid fa-house-chimney text-xs" />
            </Link>
            {activeNav && activeNav.href !== "/admin" && (
              <>
                <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" />
                <span className="font-medium text-gray-700">{activeNav.label}</span>
              </>
            )}
            {activeNav?.href === "/admin" && (
              <span className="font-medium text-gray-700">Tổng quan</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống hoạt động
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs font-bold shadow-sm">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
