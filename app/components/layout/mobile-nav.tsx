import { NavLink } from "react-router";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { visibleNav } from "~/lib/navigation";
import { useUIStore } from "~/stores/ui-store";
import { cn } from "~/lib/utils";
import type { AuthUser } from "~/lib/supabase/types";

const LUX_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Bottom tab bar shown only on mobile/tablet (<lg). Primary navigation for
 * students who mostly browse on phones. Caps at 5 visible tabs; any extra
 * items (e.g. admin-only routes) collapse into a "More" button that opens the
 * full sidebar drawer.
 */
export function MobileNav({ user }: { user: AuthUser }) {
  const items = visibleNav(user.profile?.role ?? null);
  const { setSidebar } = useUIStore();

  const VISIBLE_MAX = 5;
  const primary = items.slice(0, VISIBLE_MAX);
  const hasMore = items.length > VISIBLE_MAX;

  return (
    <nav
      aria-label="Primary"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 border-t border-gold-400/15 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-2">
        {primary.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-gold-600 dark:text-gold-300"
                    : "text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-ivory",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-active"
                      className="absolute top-0 h-0.5 w-8 rounded-b-full bg-gold-400"
                      transition={{ duration: 0.3, ease: LUX_EASE }}
                    />
                  )}
                  <item.icon className="size-5" />
                  <span className="truncate px-1 leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}

        {hasMore && (
          <li className="flex-1">
            <button
              onClick={() => setSidebar(true)}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium text-ink-500 transition-colors hover:text-ink-800 dark:text-ink-300 dark:hover:text-ivory"
              aria-label="Open menu"
            >
              <MoreHorizontal className="size-5" />
              <span className="leading-none">More</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
