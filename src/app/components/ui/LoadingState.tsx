type LoadingVariant = "cards" | "dashboard" | "profile" | "spinner" | "table";

type LoadingStateProps = {
  className?: string;
  label?: string;
  variant?: LoadingVariant;
};

const pulseClassName = "animate-pulse motion-reduce:animate-none";

const TableSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="flex gap-8 border-b border-gray-200 bg-gray-50 px-5 py-4">
      {[30, 45, 35, 25].map((width) => (
        <span
          className={`h-3 rounded-full bg-gray-200 ${pulseClassName}`}
          key={width}
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }, (_, rowIndex) => (
        <div className="flex items-center gap-8 px-5 py-5" key={rowIndex}>
          <span
            className={`h-10 w-10 shrink-0 rounded-xl bg-gray-200 ${pulseClassName}`}
          />
          <span
            className={`h-3 w-1/3 rounded-full bg-gray-200 ${pulseClassName}`}
          />
          <span
            className={`h-3 w-1/4 rounded-full bg-gray-100 ${pulseClassName}`}
          />
          <span
            className={`ml-auto h-8 w-24 rounded-xl bg-gray-100 ${pulseClassName}`}
          />
        </div>
      ))}
    </div>
  </div>
);

const CardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, index) => (
      <div
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
        key={index}
      >
        <div className={`h-44 bg-gray-200 ${pulseClassName}`} />
        <div className="space-y-3 p-5">
          <div
            className={`h-4 w-2/3 rounded-full bg-gray-200 ${pulseClassName}`}
          />
          <div
            className={`h-3 w-1/2 rounded-full bg-gray-100 ${pulseClassName}`}
          />
          <div
            className={`h-9 w-28 rounded-xl bg-gray-100 ${pulseClassName}`}
          />
        </div>
      </div>
    ))}
  </div>
);

const ProfileSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="flex flex-col items-center gap-5 bg-rose-50 p-6 sm:flex-row sm:p-8">
      <div
        className={`h-24 w-24 shrink-0 rounded-full bg-gray-200 ${pulseClassName}`}
      />
      <div className="w-full max-w-sm space-y-3">
        <div
          className={`h-5 w-1/2 rounded-full bg-gray-200 ${pulseClassName}`}
        />
        <div
          className={`h-3 w-2/3 rounded-full bg-gray-200 ${pulseClassName}`}
        />
      </div>
    </div>
    <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="space-y-2" key={index}>
          <div
            className={`h-3 w-24 rounded-full bg-gray-200 ${pulseClassName}`}
          />
          <div className={`h-11 rounded-xl bg-gray-100 ${pulseClassName}`} />
        </div>
      ))}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }, (_, index) => (
      <div
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6"
        key={index}
      >
        <div className={`h-10 w-10 rounded-xl bg-gray-200 ${pulseClassName}`} />
        <div
          className={`h-3 w-2/3 rounded-full bg-gray-100 ${pulseClassName}`}
        />
        <div
          className={`h-8 w-1/3 rounded-full bg-gray-200 ${pulseClassName}`}
        />
      </div>
    ))}
  </div>
);

const LoadingState = ({
  className = "",
  label = "Đang tải dữ liệu...",
  variant = "spinner",
}: LoadingStateProps) => {
  const skeletons = {
    cards: <CardsSkeleton />,
    dashboard: <DashboardSkeleton />,
    profile: <ProfileSkeleton />,
    table: <TableSkeleton />,
  };

  if (variant !== "spinner") {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className={className}
        role="status"
      >
        <span className="sr-only">{label}</span>
        {skeletons[variant]}
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`flex min-h-48 flex-col items-center justify-center gap-3 text-gray-500 ${className}`}
      role="status"
    >
      <div
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-4 border-rose-100 border-r-rose-500 motion-reduce:animate-none"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
};

export default LoadingState;
