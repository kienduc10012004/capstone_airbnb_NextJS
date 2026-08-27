"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminMobileMenu from "@/app/components/admin/AdminMobileMenu";
import UserMenuAvatar from "@/app/components/auth/UserMenuAvatar";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import LoadingState from "@/app/components/ui/LoadingState";
import ThemeToggle from "@/app/components/ui/ThemeToggle";
import { clearSession } from "@/app/lib/session";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

const adminNavMenu = [
  { href: "/admin", icon: "fa-solid fa-chart-pie", label: "Tổng quan" },
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
  {
    href: "/admin/account",
    icon: "fa-solid fa-user-shield",
    label: "Admin của tôi",
  },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.showToast);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setMobileMenuOpen(false);
    setLogoutConfirmOpen(false);
    showToast("Đã đăng xuất khỏi tài khoản.", "success");
    router.push("/");
    router.refresh();
  };

  const requestLogout = () => {
    setMobileMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

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
    <div className="min-h-screen bg-[#f0f2f7] dark:bg-[#0f172a] lg:grid lg:grid-cols-[260px_1fr]">
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

        {/* Nav section label */}
        <div className="hidden lg:block px-6 mb-2 mt-2">
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
                className={`flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20"
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
        onLogout={requestLogout}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200/80 bg-white/95 dark:border-white/10 dark:bg-[#1a2236]/95 px-4 py-2.5 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
              <i className="fa-solid fa-house-chimney text-xs" />
            </Link>
            {activeNav && activeNav.href !== "/admin" && (
              <>
                <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 dark:text-slate-600" />
                <span className="font-medium text-gray-700 dark:text-slate-200">{activeNav.label}</span>
              </>
            )}
            {activeNav?.href === "/admin" && (
              <span className="font-medium text-gray-700 dark:text-slate-200">Tổng quan</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <div className="hidden lg:flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-white/10 px-3 py-1.5 text-xs text-gray-500 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống hoạt động
            </div>

            {/* Admin Profile Card bên phải */}
            <Link
              href="/admin/account"
              className="flex items-center gap-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-slate-800/60 py-1.5 px-3 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-all shadow-xs"
              title="Xem và chỉnh sửa tài khoản Admin"
            >
              <UserMenuAvatar avatar={user.avatar} name={user.name || "Admin"} />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight max-w-32 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 leading-tight max-w-32 truncate">{user.email}</p>
              </div>
              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                ADMIN
              </span>
            </Link>

            {/* Logout button */}
            <button
              className="flex items-center gap-1.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all shadow-xs"
              title="Đăng xuất khỏi tài khoản Admin"
              type="button"
              onClick={requestLogout}
            >
              <i className="fa-solid fa-right-from-bracket text-xs" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <ConfirmDialog
        confirmLabel="Đăng xuất"
        description="Bạn có chắc chắn muốn kết thúc phiên đăng nhập quản trị hiện tại?"
        open={logoutConfirmOpen}
        title="Xác nhận đăng xuất"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default AdminLayout;
