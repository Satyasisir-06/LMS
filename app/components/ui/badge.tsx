import { cn } from "~/lib/utils";

type BadgeVariant = "gold" | "outline" | "success" | "danger" | "neutral" | "info";

const variants: Record<BadgeVariant, string> = {
  gold: "bg-gold-400/15 text-gold-600 dark:text-gold-300 border border-gold-400/25",
  outline: "border border-gold-400/30 text-ink-600 dark:text-ink-200",
  success:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25",
  danger: "bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/25",
  neutral: "bg-ink-500/15 text-ink-500 dark:text-ink-300 border border-ink-500/20",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
