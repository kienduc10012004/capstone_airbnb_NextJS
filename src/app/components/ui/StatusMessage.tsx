type StatusMessageProps = {
  message: string;
  type?: "error" | "success" | "info";
};

const styles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const StatusMessage = ({ message, type = "info" }: StatusMessageProps) => (
  <div
    className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    role={type === "error" ? "alert" : "status"}
  >
    {message}
  </div>
);

export default StatusMessage;
