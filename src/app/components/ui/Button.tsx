import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  "create" | "danger" | "delete" | "edit" | "ghost" | "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  create: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
  delete: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
  edit: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
  primary:
    "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm hover:from-rose-600 hover:to-pink-700 active:opacity-90",
  secondary:
    "border border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost: "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800",
};

export const buttonClassName = (
  variant: ButtonVariant = "primary",
  className = "",
) =>
  `relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,opacity] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;

const Button = ({
  children,
  className = "",
  disabled,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    aria-busy={loading}
    className={buttonClassName(variant, className)}
    disabled={disabled || loading}
    type={type}
    {...props}
  >
    <span
      className={`inline-flex items-center justify-center gap-2 transition-opacity duration-200 ${
        loading ? "opacity-0" : "opacity-100"
      }`}
    >
      {children}
    </span>
    {loading && (
      <span
        aria-hidden="true"
        className="absolute h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
      />
    )}
  </button>
);

export default Button;
