import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  "create" | "danger" | "delete" | "edit" | "ghost" | "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  create: "bg-green-600 text-white shadow-sm hover:bg-green-700",
  delete: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  edit: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  primary:
    "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm hover:from-rose-600 hover:to-pink-700",
  secondary:
    "border border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-700 hover:bg-gray-100",
};

export const buttonClassName = (
  variant: ButtonVariant = "primary",
  className = "",
) =>
  `relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-300 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 ${variants[variant]} ${className}`;

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
