import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  icon,
  disabled,
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl
        px-4 py-2.5 text-sm font-semibold transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-primary-500
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 size={17} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
