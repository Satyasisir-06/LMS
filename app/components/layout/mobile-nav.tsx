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
      className="glass-strong fixed inset-x-0 bottom-0 z-40 border-t border-gold-400/20 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(50,40,25,0.25)] lg:hidden dark:shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.5)]"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-2">
        {primary.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "relative flex h-[4.5rem] w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
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
                      className="absolute top-0 h-[3px] w-9 rounded-b-full bg-gradient-to-r from-gold-400/0 via-gold-400 to-gold-400/0"
                      transition={{ duration: 0.3, ease: LUX_EASE }}
                    />
                  )}
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full transition-colors",
                      isActive && "bg-gold-400/15",
                    )}
                  >
                    <item.icon className="size-5" />
                  </span>
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
              className="flex h-[4.5rem] w-full flex-col items-center justify-center gap-1 text-[10px] font-medium text-ink-500 transition-colors hover:text-ink-800 dark:text-ink-300 dark:hover:text-ivory"
              aria-label="Open menu"
            >
              <span className="grid size-10 place-items-center rounded-full transition-colors">
                <MoreHorizontal className="size-5" />
              </span>
              <span className="leading-none">More</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
