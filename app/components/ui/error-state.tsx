import { AlertTriangle, RefreshCw } from "lucide-react";
import { GlassCard } from "./glass-card";
import { Button } from "./button";

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <GlassCard
      className={`flex flex-col items-center justify-center gap-3 p-10 text-center ${className ?? ""}`}
    >
      <AlertTriangle className="size-8 text-red-500/70" />
      <p className="max-w-sm text-sm text-ink-800 dark:text-ivory">
        {message ?? "Something went wrong while loading this data."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Try again
        </Button>
      )}
    </GlassCard>
  );
}
