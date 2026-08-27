"use client";

import Link from "next/link";

type AdminNavigationItem = {
  href: string;
  icon: string;
  label: string;
};

type AdminMobileMenuProps = {
  email: string;
  navigationItems: readonly AdminNavigationItem[];
  open: boolean;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
};

const isAdminNavigationActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname.startsWith(href);

const AdminMobileMenu = ({
  email,
  navigationItems,
  onClose,
  onLogout,
  open,
  pathname,
}: AdminMobileMenuProps) => {
  if (!open) return null;

  return (
    <div
      aria-label="Menu quản trị"
      aria-modal="true"
      className="fixed inset-0 z-40 bg-gray-950/50 px-4 pt-20 pb-4 backdrop-blur-[2px] lg:hidden"
      role="dialog"
      onMouseDown={onClose}
    >
      <div
        className="ml-auto max-h-[calc(100dvh-6rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-gray-700 bg-gray-950 p-3 text-white shadow-2xl transition-[opacity,translate,scale] duration-300 ease-out starting:-translate-y-3 starting:scale-[0.98] starting:opacity-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
          <div>
            <p className="text-sm font-semibold">Menu quản trị</p>
            <p className="mt-1 max-w-60 truncate text-xs text-gray-400">
              {email}
            </p>
          </div>
          <button
            aria-label="Đóng menu quản trị"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            type="button"
            onClick={onClose}
          >
            <i aria-hidden="true" className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav className="mt-3 space-y-1" aria-label="Điều hướng quản trị">
          {navigationItems.map((item) => {
            const active = isAdminNavigationActive(pathname, item.href);
            return (
              <Link
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-rose-500 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                <i aria-hidden="true" className={`${item.icon} w-4`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3 space-y-1">
          <Link
            className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            href="/"
            onClick={onClose}
          >
            <i aria-hidden="true" className="fa-solid fa-chevron-left w-4" />
            Về trang người dùng
          </Link>
          <button
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-400 transition-colors duration-200 hover:bg-rose-500/20 hover:text-rose-300"
            type="button"
            onClick={onLogout}
          >
            <i aria-hidden="true" className="fa-solid fa-right-from-bracket w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMobileMenu;
