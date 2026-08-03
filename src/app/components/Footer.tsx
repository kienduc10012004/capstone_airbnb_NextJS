import Link from "next/link";

import { uiClassNames } from "@/app/lib/styles";

const footerGroups = [
  {
    links: [
      { href: "/", label: "Trang chủ" },
      { href: "/rooms", label: "Danh sách phòng" },
      { href: "/locations", label: "Điểm đến" },
    ],
    title: "Khám phá",
  },
  {
    links: [
      { href: "/profile", label: "Hồ sơ và chuyến đi" },
      { href: "/favorites", label: "Phòng yêu thích" },
    ],
    title: "Tài khoản",
  },
  {
    links: [{ href: "/admin", label: "Trang quản trị" }],
    title: "Quản lý",
  },
] as const;

const Footer = () => (
  <footer className="mt-auto border-t border-gray-200 bg-white">
    <div className={`${uiClassNames.appContainer} py-10 sm:py-12`}>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            aria-label="Airbnb - Trang chủ"
            className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-rose-500"
            href="/"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-lg text-white shadow-sm">
              A
            </span>
            airbnb
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-gray-600">
            Khám phá những không gian lưu trú phù hợp và chuẩn bị hành trình
            đáng nhớ trên khắp Việt Nam.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
            <i aria-hidden="true" className="fa-solid fa-location-dot" />
            Airbnb Việt Nam
          </div>
        </div>

        {footerGroups.map((group) => (
          <nav aria-label={group.title} key={group.title}>
            <h2 className="text-sm font-semibold text-gray-950">
              {group.title}
            </h2>
            <div className="mt-4 space-y-1">
              {group.links.map((link) => (
                <Link
                  className="group flex w-fit items-center gap-2 rounded-lg py-1.5 text-sm text-gray-600 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1.5 hover:text-rose-600"
                  href={link.href}
                  key={link.href}
                >
                  <i
                    aria-hidden="true"
                    className="fa-solid fa-chevron-right text-[10px] text-gray-300 transition-colors duration-500 ease-out group-hover:text-rose-500"
                  />
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ))}
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-600 sm:mt-12">
        <p>© 2026 Airbnb Capstone. Huỳnh Gia Huy - Lê Đức Kiên</p>
      </div>
    </div>
  </footer>
);

export default Footer;
