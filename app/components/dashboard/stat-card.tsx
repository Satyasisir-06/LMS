import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "~/components/ui/glass-card";
import { cn } from "~/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <GlassCard className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-mist">
              {label}
            </p>
            <p className="mt-2 font-serif text-3xl text-ink-800 dark:text-ivory">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "grid size-10 place-items-center rounded-xl bg-gold-400/12 text-gold-500 dark:text-gold-300",
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>
        {hint && <p className="mt-3 text-xs text-mist">{hint}</p>}
      </GlassCard>
    </motion.div>
  );
}
