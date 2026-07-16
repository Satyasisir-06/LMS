import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

/**
 * Ambient animated aurora halo used behind auth + landing surfaces.
 * Purely decorative; pointer-events disabled.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <motion.div
        className="absolute -left-1/4 -top-1/4 size-[55vw] rounded-full bg-gold-400/20 blur-[120px]"
        animate={{ x: [0, 60, -30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 top-1/3 size-[45vw] rounded-full bg-gold-600/15 blur-[120px]"
        animate={{ x: [0, -50, 20, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 size-[40vw] rounded-full bg-emerald-700/10 blur-[120px]"
        animate={{ x: [0, 40, -40, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Fine grain / vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.06))] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45))]" />
    </div>
  );
}
