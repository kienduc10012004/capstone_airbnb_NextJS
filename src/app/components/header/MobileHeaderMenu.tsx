"use client";

import Link from "next/link";

import ThemeToggle from "@/app/components/ui/ThemeToggle";
import UserMenuAvatar from "@/app/components/auth/UserMenuAvatar";
import type { AuthMode } from "@/app/components/auth/AuthModal";
import type { ApiUser } from "@/app/lib/api";

type NavigationItem = {
  href: string;
  icon: string;
  label: string;
};

type MobileHeaderMenuProps = {
  accountMenuOpen: boolean;
  menuOpen: boolean;
  navigationItems: readonly NavigationItem[];
  pathname: string;
  user: ApiUser | null;
  onClose: () => void;
  onLogout: () => void;
  onOpenAuth: (mode: AuthMode) => void;
  onToggleAccountMenu: () => void;
};

const isNavigationItemActive = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname.startsWith(href);

const MobileHeaderMenu = ({
  accountMenuOpen: _accountMenuOpen,
  menuOpen,
  navigationItems,
  pathname,
  user,
  onClose,
  onLogout,
  onOpenAuth,
  onToggleAccountMenu: _onToggleAccountMenu,
}: MobileHeaderMenuProps) => {
  if (!menuOpen) return null;

  return (
    <div
      aria-label="Menu điều hướng"
      aria-modal="true"
      className="fixed inset-0 z-40 bg-gray-950/35 px-4 pt-20 pb-3 backdrop-blur-[2px] sm:pt-[84px] lg:hidden"
      role="dialog"
      onMouseDown={onClose}
    >
      <div
        className="ml-auto max-h-[calc(100dvh-5.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl transition-[opacity,translate,scale] duration-300 ease-out starting:-translate-y-3 starting:scale-[0.98] starting:opacity-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-2 pb-3">
          <p className="text-sm font-semibold text-gray-950">Menu chính</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              aria-label="Đóng menu chính"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-gray-600 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600"
              type="button"
              onClick={onClose}
            >
              <i aria-hidden="true" className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <nav
          aria-label="Điều hướng trên tablet và mobile"
          className="mt-2 space-y-1"
        >
          {navigationItems.map((item) => {
            const active = isNavigationItemActive(pathname, item.href);
            return (
              <Link
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-rose-50 text-rose-600"
                    : "text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                }`}
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gray-50">
                  <i aria-hidden="true" className={item.icon} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-gray-100 pt-3">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <UserMenuAvatar
                    avatar={user.avatar}
                    key={user.avatar || user.id}
                    name={user.name}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-950">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                  type="button"
                  onClick={onLogout}
                >
                  Đăng xuất
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  className={`cursor-pointer rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2236] p-3 text-center text-sm font-medium transition-colors hover:border-rose-300 hover:text-rose-600 ${
                    pathname === "/profile"
                      ? "border-rose-300 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/20"
                      : "text-gray-900 dark:text-slate-200"
                  }`}
                  href="/profile"
                  onClick={onClose}
                >
                  Hồ sơ
                </Link>
                <Link
                  className={`cursor-pointer rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2236] p-3 text-center text-sm font-medium transition-colors hover:border-rose-300 hover:text-rose-600 ${
                    pathname === "/favorites"
                      ? "border-rose-300 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/20"
                      : "text-gray-900 dark:text-slate-200"
                  }`}
                  href="/favorites"
                  onClick={onClose}
                >
                  Phòng yêu thích
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    className={`col-span-2 cursor-pointer rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2236] p-3 text-center text-sm font-semibold transition-colors hover:border-rose-300 hover:text-rose-600 ${
                      pathname.startsWith("/admin")
                        ? "border-rose-300 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/20"
                        : "text-gray-900 dark:text-slate-200"
                    }`}
                    href="/admin"
                    onClick={onClose}
                  >
                    Trang quản trị
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-semibold text-gray-900 shadow-xs hover:border-rose-300 hover:text-rose-600"
                type="button"
                onClick={() => onOpenAuth("SignIn")}
              >
                Đăng nhập
              </button>
              <button
                className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95"
                type="button"
                onClick={() => onOpenAuth("SignUp")}
              >
                Tạo tài khoản
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHeaderMenu;
