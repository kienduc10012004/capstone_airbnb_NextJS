type LoadingVariant = "cards" | "dashboard" | "profile" | "spinner" | "table";

type LoadingStateProps = {
  className?: string;
  label?: string;
  variant?: LoadingVariant;
};

const LoadingState = ({
  className = "",
  label = "Đang tải...",
}: LoadingStateProps) => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`flex min-h-[45vh] flex-col items-center justify-center gap-3 text-gray-500 dark:text-slate-400 ${className}`}
      role="status"
    >
      <div
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-4 border-rose-100 border-r-rose-500 motion-reduce:animate-none"
      />
      <p className="text-sm font-medium">{label || "Đang tải..."}</p>
    </div>
  );
};

export default LoadingState;
