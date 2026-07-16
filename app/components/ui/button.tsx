import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "subtle" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-gold-200 via-gold-400 to-gold-500 text-ink-950 shadow-[0_8px_30px_-10px_rgba(203,168,104,0.55)] hover:shadow-[0_14px_44px_-12px_rgba(203,168,104,0.85)] hover:brightness-105",
  outline:
    "border border-gold-400/30 text-ink-800 dark:text-ink-100 hover:border-gold-400/60 hover:bg-gold-400/10",
  ghost:
    "text-ink-600 dark:text-ink-200 hover:bg-ink-500/10 dark:hover:bg-ink-500/20",
  subtle:
    "bg-ink-500/10 dark:bg-ink-500/15 text-ink-700 dark:text-ink-100 hover:bg-ink-500/20 dark:hover:bg-ink-500/25",
  danger:
    "bg-red-500/90 text-white hover:bg-red-500 shadow-[0_8px_30px_-12px_rgba(239,68,68,0.6)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
