import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
  AnimatePresence,
} from "framer-motion";
import { cn } from "~/lib/utils";

export type DockItem = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItem[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
};

const DEFAULT_SIZE = 56;

function DockItem({
  size,
  magnification,
  distance,
  spring,
  mouseX,
  item,
}: {
  size: number;
  magnification: number;
  distance: number;
  spring: SpringOptions;
  mouseX: MotionValue<number>;
  item: DockItem;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: size };
    return val - rect.x - size / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [size, magnification, size],
  );
  const heightTransform = widthTransform;
  const width = useSpring(widthTransform, spring);
  const height = useSpring(heightTransform, spring);
  const opacity = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [0.5, 1, 0.5],
  );

  return (
    <motion.button
      ref={ref}
      onClick={item.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width, height, opacity }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl bg-ink-500/5 text-ink-500 outline-none ring-1 ring-gold-400/10 backdrop-blur transition-colors hover:bg-gold-400/15 hover:text-gold-600 dark:text-ink-300 dark:hover:text-gold-300",
        item.className,
      )}
      aria-label={item.label}
    >
      <motion.span
        style={{ width: size, height: size }}
        className="flex items-center justify-center"
      >
        {item.icon}
      </motion.span>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-lg border border-gold-400/20 bg-ink-950/90 px-2 py-1 text-[11px] font-medium text-ivory shadow-lg"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Dock({
  items,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 72,
  distance = 110,
  panelHeight = 68,
  baseItemSize = DEFAULT_SIZE,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      onTouchMove={(e) => mouseX.set(e.touches[0]?.pageX ?? Infinity)}
      className={cn(
        "glass-strong mx-auto flex w-fit items-end gap-3 rounded-3xl border border-gold-400/20 px-4 shadow-[0_-8px_30px_-12px_rgba(50,40,25,0.25)] dark:shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.5)]",
        className,
      )}
      style={{ height: panelHeight }}
    >
      {items.map((item, i) => (
        <DockItem
          key={i}
          size={baseItemSize}
          magnification={magnification}
          distance={distance}
          spring={spring}
          mouseX={mouseX}
          item={item}
        />
      ))}
    </motion.div>
  );
}
