type LoadingOverlayProps = {
  label?: string;
};

const LoadingOverlay = ({
  label = "Đang cập nhật dữ liệu...",
}: LoadingOverlayProps) => (
  <div
    aria-busy="true"
    aria-live="polite"
    className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-[1px] transition-opacity duration-200"
    role="status"
  >
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-md">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-r-rose-500 motion-reduce:animate-none"
      />
      {label}
    </span>
  </div>
);

export default LoadingOverlay;
