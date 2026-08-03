import LoadingState from "@/app/components/ui/LoadingState";

export default function AdminLoading() {
  return (
    <LoadingState
      className="mt-8"
      label="Đang tải trang quản trị..."
      variant="dashboard"
    />
  );
}
