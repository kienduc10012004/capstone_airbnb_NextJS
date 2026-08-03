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

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950 text-white lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-6 lg:py-6">
          <Link className="flex items-center gap-3 font-bold" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500">
              A
            </span>
            <span>Airbnb Admin</span>
          </Link>
          <Link
            className="hidden text-xs text-gray-400 hover:text-white lg:mt-4 lg:block"
            href="/"
          >
            <i aria-hidden="true" className="fa-solid fa-chevron-left mr-1" />
            Về trang người dùng
          </Link>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={
              mobileMenuOpen ? "Đóng menu quản trị" : "Mở menu quản trị"
            }
            className={`relative z-50 grid h-11 w-11 cursor-pointer place-items-center rounded-full border text-lg shadow-sm transition-all duration-300 lg:hidden ${
              mobileMenuOpen
                ? "border-rose-400 bg-white text-rose-600"
                : "border-gray-700 bg-gray-900 text-white hover:border-rose-400 hover:text-rose-400"
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
        <nav className="hidden space-y-1 px-4 lg:block">
          {adminNavMenu.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                className={`flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-rose-500 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
                href={item.href}
                key={item.href}
              >
                <i aria-hidden="true" className={`${item.icon} w-4`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/10 p-6 text-xs text-gray-400 lg:absolute lg:right-0 lg:bottom-0 lg:left-0 lg:block">
          Đăng nhập với {user.email}
        </div>
      </aside>
      <AdminMobileMenu
        email={user.email}
        navigationItems={adminNavMenu}
        open={mobileMenuOpen}
        pathname={pathname}
        onClose={() => setMobileMenuOpen(false)}
      />
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
