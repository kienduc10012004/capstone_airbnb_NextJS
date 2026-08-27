import LoadingState from "@/app/components/ui/LoadingState";

export default function AdminLoading() {
  return (
    <LoadingState
      className="min-h-[50vh]"
      label="Đang tải..."
    />
  );
}
