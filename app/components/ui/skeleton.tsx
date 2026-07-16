import { cn } from "~/lib/utils";

/** Shimmering placeholder block. Uses the existing `.shimmer` token in app.css. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-ink-500/10", className)} />;
}
