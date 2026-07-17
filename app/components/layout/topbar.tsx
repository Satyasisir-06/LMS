import { useState } from "react";
import { Form, NavLink, useNavigation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useUIStore } from "~/stores/ui-store";
import { Badge } from "~/components/ui/badge";
import { NotificationsBell } from "~/components/layout/notifications-bell";
import { LogoMark } from "~/components/ui/logo";
import { getInitials, cn } from "~/lib/utils";
import { ROLE_LABELS, type AuthUser } from "~/lib/supabase/types";

export function Topbar({ user }: { user: AuthUser }) {
  const { toggleSidebar, theme, toggleTheme } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation();
  const role = user.profile?.role;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-gold-400/10 bg-paper-50/80 px-4 backdrop-blur-md dark:bg-ink-950/80 sm:px-6">
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleSidebar}
          className="grid size-10 place-items-center rounded-xl border border-gold-400/20 bg-ink-500/5 text-ink-600 transition-all hover:border-gold-400/40 hover:bg-ink-500/10 active:scale-95 dark:bg-ink-900/40 dark:text-ink-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <NavLink
          to="/dashboard"
          aria-label="Athenaeum home"
          className="flex items-center gap-2.5"
        >
          <LogoMark className="size-8" />
          <span className="hidden font-display text-xl leading-none text-ink-800 dark:text-ivory sm:block">
            Athen<span className="text-gold-gradient">aeum</span>
          </span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationsBell />
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-500/10 dark:text-ink-300"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="block"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </motion.span>
          </AnimatePresence>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2.5 rounded-full border border-gold-400/20 py-1.5 pl-1.5 pr-3 transition-colors hover:border-gold-400/40",
              menuOpen && "border-gold-400/50",
            )}
          >
            {user.profile?.avatar_url ? (
              <img
                src={user.profile.avatar_url}
                alt={user.profile.full_name ?? "Avatar"}
                className="size-8 rounded-full object-cover border border-gold-400/20"
              />
            ) : (
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-xs font-semibold text-ink-950">
                {getInitials(user.profile?.full_name ?? user.email)}
              </span>
            )}
            <span className="hidden flex-col leading-tight text-left sm:flex">
              <span className="max-w-[140px] truncate text-sm font-medium text-ink-800 dark:text-ivory">
                {user.profile?.full_name ?? user.email}
              </span>
              {role && (
                <span className="text-[11px] text-mist">{ROLE_LABELS[role]}</span>
              )}
            </span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                  tabIndex={-1}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-strong absolute right-0 z-20 mt-2 w-60 rounded-xl p-2"
                >
                  <div className="border-b border-gold-400/10 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                      {user.profile?.full_name ?? "Member"}
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-300 font-medium mt-0.5">{user.email}</p>
                    {role && (
                      <Badge variant="gold" className="mt-2 font-semibold">
                        {ROLE_LABELS[role]}
                      </Badge>
                    )}
                  </div>
                  <Form method="post" action="/logout" onSubmit={() => setMenuOpen(false)}>
                    <button
                      type="submit"
                      disabled={navigation.state === "submitting"}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="size-3.5" />
                      Sign out
                    </button>
                  </Form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
