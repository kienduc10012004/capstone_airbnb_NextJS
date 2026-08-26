type StatusMessageProps = {
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

const StatusMessage = ({ message, type = "info" }: StatusMessageProps) => (
  <div
    className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${styles[type]}`}
    role={type === "error" ? "alert" : "status"}
  >
    {message}
  </div>
);

export default StatusMessage;
