import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "~/lib/utils";

type GlassCardProps = HTMLMotionProps<"div"> & {
  interactive?: boolean;
  strong?: boolean;
};

const LUX_EASE = [0.22, 1, 0.36, 1] as const;

export function GlassCard({
  className,
  interactive,
  strong,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: LUX_EASE }}
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-2xl",
        interactive && "cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
