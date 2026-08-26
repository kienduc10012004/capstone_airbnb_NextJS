type StatusMessageProps = {
  action?: {
    label: string;
    onClick: () => void;
  };
  message: string;
  type?: "error" | "success" | "info";
};

const styles = {
  error:
    "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300",
  success:
    "border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300",
  info:
    "border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
};

const StatusMessage = ({
  action,
  message,
  type = "info",
}: StatusMessageProps) => (
  <div
    className={`rounded-xl border px-4 py-3 text-sm shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${styles[type]}`}
    role={type === "error" ? "alert" : "status"}
  >
    <div className="flex items-start gap-2.5">
      <i
        aria-hidden="true"
        className={`mt-0.5 text-base shrink-0 fa-solid ${
          type === "error"
            ? "fa-circle-exclamation text-red-500"
            : type === "success"
              ? "fa-circle-check text-green-500"
              : "fa-circle-info text-blue-500"
        }`}
      />
      <span className="leading-snug">{message}</span>
    </div>
    {action && (
      <button
        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
        type="button"
        onClick={action.onClick}
      >
        <i className="fa-solid fa-calendar-days text-[11px]" />
        <span>{action.label}</span>
      </button>
    )}
  </div>
);

export default StatusMessage;
