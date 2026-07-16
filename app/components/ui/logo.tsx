import { cn } from "~/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("size-9", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="athenaeum-gold" x1="6" y1="6" x2="42" y2="42">
          <stop stopColor="#ecd9a6" />
          <stop offset="0.5" stopColor="#cba868" />
          <stop offset="1" stopColor="#9a7846" />
        </linearGradient>
      </defs>
      {/* Arch — quiet-luxury classical motif */}
      <path
        d="M8 38c0-11 7.5-20 16-20s16 9 16 20"
        stroke="url(#athenaeum-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Open book */}
      <path
        d="M14 34c4-3 8-3 10-1 2-2 6-2 10 1"
        stroke="url(#athenaeum-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 33v-9"
        stroke="url(#athenaeum-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Keystone star */}
      <circle cx="24" cy="14" r="2" fill="url(#athenaeum-gold)" />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="font-display text-[1.85rem] leading-none tracking-normal text-ink-800 dark:text-ivory mt-0.5">
          Athen<span className="text-gold-gradient">aeum</span>
        </span>
      )}
    </span>
  );
}
