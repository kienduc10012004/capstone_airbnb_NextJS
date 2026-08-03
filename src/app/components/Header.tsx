"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import AuthModal, { type AuthMode } from "@/app/components/auth/AuthModal";
import MobileHeaderMenu from "@/app/components/header/MobileHeaderMenu";
import UserMenuAvatar from "@/app/components/auth/UserMenuAvatar";
import SearchPanel from "@/app/components/search/SearchPanel";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import type { ApiUser } from "@/app/lib/api";
import {
  OPEN_SIGN_IN_EVENT,
  SIGN_IN_EMAIL_STORAGE_KEY,
} from "@/app/lib/auth-events";
import { HOME_SEARCH_COMPACT_EVENT } from "@/app/lib/home-search";
import { clearSession } from "@/app/lib/session";
import { uiClassNames } from "@/app/lib/styles";
import { useAuthStore } from "@/app/store/useAuthStore";

const navigationItems = [
  { href: "/", icon: "fa-regular fa-compass", label: "Khám phá" },
  { href: "/rooms", icon: "fa-solid fa-bed", label: "Phòng ở" },
  { href: "/locations", icon: "fa-solid fa-location-dot", label: "Điểm đến" },
] as const;

const isNavigationItemActive = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname.startsWith(href);

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("SignIn");
  const [authOpen, setAuthOpen] = useState(false);
  const [initialSignInEmail, setInitialSignInEmail] = useState("");
  const [compactSearchVisible, setCompactSearchVisible] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  //==== Đồng bộ Header: quản lý session, menu responsive và thanh tìm kiếm thu gọn ====
  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setDesktopMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    const openRequestedSignIn = window.setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get("auth") !== "signin") return;

      setInitialSignInEmail(
        window.sessionStorage.getItem(SIGN_IN_EMAIL_STORAGE_KEY) ?? "",
      );
      window.sessionStorage.removeItem(SIGN_IN_EMAIL_STORAGE_KEY);
      setAuthMode("SignIn");
      setAuthOpen(true);
      currentUrl.searchParams.delete("auth");
      window.history.replaceState(
        null,
        "",
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    }, 0);

    return () => window.clearTimeout(openRequestedSignIn);
  }, []);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");

    const closeMenusForCurrentViewport = () => {
      if (desktopMediaQuery.matches) {
        setMobileMenuOpen(false);
        setMobileAccountMenuOpen(false);
      } else {
        setDesktopMenuOpen(false);
      }
    };

    closeMenusForCurrentViewport();
    desktopMediaQuery.addEventListener("change", closeMenusForCurrentViewport);
    return () => {
      desktopMediaQuery.removeEventListener(
        "change",
        closeMenusForCurrentViewport,
      );
    };
  }, []);

  useEffect(() => {
    const closeMenusAfterNavigation = window.setTimeout(() => {
      setDesktopMenuOpen(false);
      setMobileMenuOpen(false);
      setMobileAccountMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(closeMenusAfterNavigation);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileAccountMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const updateCompactSearch = (event: Event) => {
      const visible = (event as CustomEvent<boolean>).detail;
      setCompactSearchVisible(visible);
    };

    window.addEventListener(HOME_SEARCH_COMPACT_EVENT, updateCompactSearch);
    return () => {
      window.removeEventListener(
        HOME_SEARCH_COMPACT_EVENT,
        updateCompactSearch,
      );
    };
  }, []);

  useEffect(() => {
    const openSignIn = () => {
      setAuthMode("SignIn");
      setAuthOpen(true);
      setDesktopMenuOpen(false);
      setMobileMenuOpen(false);
      setMobileAccountMenuOpen(false);
    };

    window.addEventListener(OPEN_SIGN_IN_EVENT, openSignIn);
    return () => window.removeEventListener(OPEN_SIGN_IN_EVENT, openSignIn);
  }, []);

  //==== Xác thực người dùng: cập nhật phiên đăng nhập và xử lý đăng xuất có xác nhận ====
  const handleSignedIn = (signedInUser: ApiUser) => {
    setUser(signedInUser);
    setAuthOpen(false);
    if (signedInUser.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.refresh();
    }
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileAccountMenuOpen(false);
    setLogoutConfirmOpen(false);
    router.push("/");
    router.refresh();
  };

  const requestLogout = () => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileAccountMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileAccountMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileAccountMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((current) => {
      if (current) setMobileAccountMenuOpen(false);
      return !current;
    });
  };

  //==== Giao diện Header: phân tách điều hướng desktop, mobile và menu tài khoản ====
  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 shadow-[0_4px_24px_rgb(15_23_42/0.04)] backdrop-blur-xl"
        data-compact-search-visible={compactSearchVisible}
        data-site-header
      >
        <div className={uiClassNames.appContainer}>
          <div className="flex h-16 items-center justify-between gap-3 sm:h-18 sm:gap-4">
            <Link
              aria-label="Airbnb - Trang chủ"
              className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-rose-500 sm:text-2xl"
              href="/"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-lg text-white shadow-sm sm:h-10 sm:w-10">
                A
              </span>
              <span className="hidden sm:inline">airbnb</span>
            </Link>

            <nav className="hidden items-center rounded-full bg-gray-50 p-1 text-sm font-medium lg:flex">
              {navigationItems.map((item) => {
                const active = isNavigationItemActive(pathname, item.href);
                return (
                  <Link
                    className={`rounded-full px-3 py-2 lg:px-4 ${
                      active
                        ? "bg-white text-rose-600 shadow-sm"
                        : "text-gray-700 hover:bg-white hover:text-rose-600"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="relative hidden shrink-0 lg:block" ref={menuRef}>
              <button
                aria-expanded={desktopMenuOpen}
                aria-label="Mở menu tài khoản"
                className={`group flex items-center gap-2 rounded-full border bg-white py-1.5 pr-1.5 pl-3 text-gray-950 shadow-sm hover:border-rose-300 hover:text-rose-600 hover:shadow-md ${
                  desktopMenuOpen
                    ? "border-rose-300 text-rose-600"
                    : "border-gray-300"
                }`}
                type="button"
                onClick={() => {
                  setDesktopMenuOpen((current) => !current);
                }}
              >
                <span className="text-lg leading-none">☰</span>
                {hydrated && user && (
                  <span
                    className="hidden max-w-28 truncate text-sm font-medium lg:block xl:max-w-44"
                    title={`Xin chào ${user.name}`}
                  >
                    Xin chào {user.name}
                  </span>
                )}
                {hydrated && user ? (
                  <UserMenuAvatar
                    avatar={user.avatar}
                    key={user.avatar || user.id}
                    name={user.name}
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-sm text-white">
                    ●
                  </span>
                )}
              </button>

              {desktopMenuOpen && (
                <div className="absolute top-13 right-0 z-20 w-[min(288px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p
                      className="truncate text-sm font-semibold text-gray-950"
                      title={user?.name}
                    >
                      {user ? user.name : "Xin chào bạn"}
                    </p>
                    <p
                      className="truncate text-xs text-gray-950"
                      title={user?.email}
                    >
                      {user?.email ?? "Đăng nhập để bắt đầu hành trình"}
                    </p>
                  </div>
                  <div className="p-2">
                    {user ? (
                      <>
                        <Link
                          className={`block rounded-xl px-3 py-2.5 text-sm ${
                            pathname === "/profile"
                              ? "bg-rose-50 text-rose-600"
                              : "text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                          }`}
                          href="/profile"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          Hồ sơ và chuyến đi
                        </Link>
                        <Link
                          className={`block rounded-xl px-3 py-2.5 text-sm ${
                            pathname === "/favorites"
                              ? "bg-rose-50 text-rose-600"
                              : "text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                          }`}
                          href="/favorites"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          Phòng yêu thích
                        </Link>
                        {user.role === "ADMIN" && (
                          <Link
                            className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                              pathname.startsWith("/admin")
                                ? "bg-rose-50 text-rose-600"
                                : "text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                            }`}
                            href="/admin"
                            onClick={() => setDesktopMenuOpen(false)}
                          >
                            Trang quản trị
                          </Link>
                        )}
                        <button
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                          type="button"
                          onClick={requestLogout}
                        >
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                          type="button"
                          onClick={() => openAuth("SignIn")}
                        >
                          Đăng nhập
                        </button>
                        <button
                          className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-950 hover:bg-rose-50 hover:text-rose-600"
                          type="button"
                          onClick={() => openAuth("SignUp")}
                        >
                          Tạo tài khoản
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              className={`relative z-50 grid h-11 w-11 cursor-pointer place-items-center rounded-full border bg-white text-lg shadow-sm transition-all duration-300 lg:hidden ${
                mobileMenuOpen
                  ? "border-rose-300 text-rose-600 shadow-md"
                  : "border-gray-300 text-gray-950 hover:border-rose-300 hover:text-rose-600"
              }`}
              type="button"
              onClick={toggleMobileMenu}
            >
              <i
                aria-hidden="true"
                className={
                  mobileMenuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"
                }
              />
            </button>
          </div>

          {compactSearchVisible && (
            <div
              className="mx-auto hidden max-w-[760px] pt-2 pb-3 transition-[opacity,translate,scale] duration-300 ease-out starting:-translate-y-2 starting:scale-[0.98] starting:opacity-0 lg:block"
              data-compact-search-trigger="true"
            >
              <SearchPanel compact />
            </div>
          )}
        </div>
      </header>
      <MobileHeaderMenu
        accountMenuOpen={mobileAccountMenuOpen}
        menuOpen={mobileMenuOpen}
        navigationItems={navigationItems}
        pathname={pathname}
        user={hydrated ? user : null}
        onClose={closeMobileMenu}
        onLogout={requestLogout}
        onOpenAuth={openAuth}
        onToggleAccountMenu={() =>
          setMobileAccountMenuOpen((current) => !current)
        }
      />
      <AuthModal
        initialSignInEmail={initialSignInEmail}
        mode={authMode}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        onSignedIn={handleSignedIn}
      />
      <ConfirmDialog
        confirmLabel="Đăng xuất"
        description="Bạn có chắc chắn muốn kết thúc phiên đăng nhập hiện tại?"
        open={logoutConfirmOpen}
        title="Xác nhận đăng xuất"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Header;
