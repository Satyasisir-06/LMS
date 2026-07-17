import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "~/stores/toast-store";
import { cn } from "~/lib/utils";

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const accent: Record<ToastVariant, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-gold-600 dark:text-gold-300",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2 lg:bottom-4"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl border border-gold-400/20 p-3.5 shadow-elevate"
              role="status"
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", accent[t.variant])} />
              <p className="flex-1 text-sm text-ink-800 dark:text-ivory">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-mist transition-colors hover:bg-ink-500/10 hover:text-ink-800 dark:hover:text-ivory"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
