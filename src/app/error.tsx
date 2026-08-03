"use client";

import Button from "@/app/components/ui/Button";
import { uiClassNames } from "@/app/lib/styles";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-gray-50 px-4">
      <div className={`${uiClassNames.surface} max-w-lg p-8 text-center`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-500">
          !
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Đã có lỗi xảy ra</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Hệ thống chưa thể hoàn tất yêu cầu. Vui lòng thử lại sau ít phút.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400">Mã lỗi: {error.digest}</p>
        )}
        <Button className="mt-6" onClick={unstable_retry}>
          Thử lại
        </Button>
      </div>
    </div>
  );
}
