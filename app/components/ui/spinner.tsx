import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-gold-400", className)} />;
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Spinner className="size-8" />
      {label && <p className="text-sm text-mist">{label}</p>}
    </div>
  );
}
