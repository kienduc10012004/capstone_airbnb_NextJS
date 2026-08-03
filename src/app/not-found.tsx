import Link from "next/link";

import Header from "@/app/components/Header";
import { buttonClassName } from "@/app/components/ui/Button";
import { uiClassNames } from "@/app/lib/styles";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={`${uiClassNames.appContainer} py-20 text-center`}>
        <p className="text-7xl font-bold text-rose-500">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Không tìm thấy trang</h1>
        <p className="mt-2 text-gray-500">
          Nội dung bạn tìm kiếm có thể đã thay đổi hoặc không còn tồn tại.
        </p>
        <Link className={buttonClassName("primary", "mt-6")} href="/">
          Về trang chủ
        </Link>
      </main>
    </div>
  );
}
