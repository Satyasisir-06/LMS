import type { LucideIcon } from "lucide-react";
import { GlassCard } from "~/components/ui/glass-card";
import { Badge } from "~/components/ui/badge";

export function SectionPlaceholder({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <GlassCard className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-gold-400/12 text-gold-500 dark:text-gold-300">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-5 font-serif text-2xl text-ink-800 dark:text-ivory">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm text-mist">{description}</p>
      <Badge variant="outline" className="mt-5">
        {phase}
      </Badge>
    </GlassCard>
  );
}
