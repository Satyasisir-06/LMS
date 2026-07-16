import { NavLink } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { visibleNav } from "~/lib/navigation";
import { useUIStore } from "~/stores/ui-store";
import { Logo } from "~/components/ui/logo";
import { Badge } from "~/components/ui/badge";
import { ROLE_LABELS, type AuthUser } from "~/lib/supabase/types";
import { cn } from "~/lib/utils";

export function Sidebar({ user }: { user: AuthUser }) {
  const items = visibleNav(user.profile?.role ?? null);
  const { sidebarOpen, setSidebar } = useUIStore();
  const role = user.profile?.role;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebar(false)}
            className="fixed inset-0 z-30 bg-ink-950/60 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
          />
        )}
      </AnimatePresence>

      {/* Drawer / static rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-6 p-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
          "glass border-r border-gold-400/10",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <NavLink to="/" onClick={() => setSidebar(false)}>
            <Logo />
          </NavLink>
          <button
            onClick={() => setSidebar(false)}
            className="rounded-lg p-1.5 text-mist hover:bg-ink-500/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200",
                  isActive
                    ? "bg-gold-400/12 text-gold-600 dark:text-gold-300"
                    : "text-ink-500 hover:bg-ink-500/8 hover:text-ink-800 dark:text-ink-300 dark:hover:text-ivory",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold-400"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <item.icon className="size-[18px] shrink-0" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[11px] text-mist">{item.description}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {role && (
          <div className="rounded-xl border border-gold-400/15 bg-ink-500/5 dark:bg-ink-900/60 dark:border-gold-400/25 p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-mist">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-medium text-ink-800 dark:text-ivory">
              {user.profile?.full_name ?? user.email}
            </p>
            <Badge variant="gold" className="mt-2">
              {ROLE_LABELS[role]}
            </Badge>
          </div>
        )}
      </aside>
    </>
  );
}
