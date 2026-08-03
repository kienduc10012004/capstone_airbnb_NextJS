"use client";

import Link from "next/link";

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
  accountMenuOpen,
  menuOpen,
  navigationItems,
  pathname,
  user,
  onClose,
  onLogout,
  onOpenAuth,
  onToggleAccountMenu,
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
          <button
            aria-label="Đóng menu chính"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-gray-600 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600"
            type="button"
            onClick={onClose}
          >
            <i aria-hidden="true" className="fa-solid fa-xmark" />
          </button>
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
          <button
            aria-expanded={accountMenuOpen}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
              accountMenuOpen
                ? "border-rose-200 bg-rose-50"
                : "border-gray-200 hover:border-rose-200 hover:bg-rose-50"
            }`}
            type="button"
            onClick={onToggleAccountMenu}
          >
            {user ? (
              <UserMenuAvatar
                avatar={user.avatar}
                key={user.avatar || user.id}
                name={user.name}
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-sm text-white">
                <i aria-hidden="true" className="fa-solid fa-user" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-sm font-semibold text-gray-950"
                title={user ? `Xin chào ${user.name}` : "Xin chào bạn"}
              >
                {user ? `Xin chào ${user.name}` : "Xin chào bạn"}
              </span>
              <span className="block truncate text-xs text-gray-500">
                {user?.email ?? "Đăng nhập để bắt đầu hành trình"}
              </span>
            </span>
            <i
              aria-hidden="true"
              className={`fa-solid fa-chevron-right text-gray-500 transition-transform duration-300 ${
                accountMenuOpen ? "rotate-90 text-rose-600" : ""
              }`}
            />
          </button>

          {accountMenuOpen && (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-inner transition-[opacity,translate] duration-300 ease-out starting:-translate-x-3 starting:opacity-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                  Tài khoản
                </p>
                <button
                  aria-label="Đóng menu tài khoản"
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-gray-600 transition-colors duration-200 hover:bg-white hover:text-rose-600"
                  type="button"
                  onClick={onToggleAccountMenu}
                >
                  <i aria-hidden="true" className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {user ? (
                  <>
                    <Link
                      className={`cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm shadow-sm transition-colors duration-200 hover:text-rose-600 ${
                        pathname === "/profile"
                          ? "text-rose-600"
                          : "text-gray-950"
                      }`}
                      href="/profile"
                      onClick={onClose}
                    >
                      Hồ sơ và chuyến đi
                    </Link>
                    <Link
                      className={`cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm shadow-sm transition-colors duration-200 hover:text-rose-600 ${
                        pathname === "/favorites"
                          ? "text-rose-600"
                          : "text-gray-950"
                      }`}
                      href="/favorites"
                      onClick={onClose}
                    >
                      Phòng yêu thích
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        className={`cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm font-medium shadow-sm transition-colors duration-200 hover:text-rose-600 ${
                          pathname.startsWith("/admin")
                            ? "text-rose-600"
                            : "text-gray-950"
                        }`}
                        href="/admin"
                        onClick={onClose}
                      >
                        Trang quản trị
                      </Link>
                    )}
                    <button
                      className="cursor-pointer rounded-xl bg-white px-3 py-3 text-sm text-gray-950 shadow-sm transition-colors duration-200 hover:text-rose-600"
                      type="button"
                      onClick={onLogout}
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="cursor-pointer rounded-xl bg-white px-3 py-3 text-sm font-semibold text-gray-950 shadow-sm transition-colors duration-200 hover:text-rose-600"
                      type="button"
                      onClick={() => onOpenAuth("SignIn")}
                    >
                      Đăng nhập
                    </button>
                    <button
                      className="cursor-pointer rounded-xl bg-white px-3 py-3 text-sm text-gray-950 shadow-sm transition-colors duration-200 hover:text-rose-600"
                      type="button"
                      onClick={() => onOpenAuth("SignUp")}
                    >
                      Tạo tài khoản
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHeaderMenu;
