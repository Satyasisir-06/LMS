import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BookOpen, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { useUser } from "~/providers/app-context";
import { relativeTime, cn } from "~/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: "info" | "success" | "danger";
};

const toneIcon = {
  info: CalendarClock,
  success: CheckCircle2,
  danger: AlertTriangle,
} as const;

const toneClass = {
  info: "text-gold-600 dark:text-gold-300",
  success: "text-emerald-600 dark:text-emerald-300",
  danger: "text-red-600 dark:text-red-300",
} as const;

export function NotificationsBell() {
  const user = useUser();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: async (): Promise<Notification[]> => {
      const [holds, loans] = await Promise.all([
        supabase
          .from("holds")
          .select("id, book_id, status, created_at, books(title)")
          .eq("user_id", user.id)
          .in("status", ["pending", "fulfilled"])
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("borrowings")
          .select(
            "id, due_date, status, fine_amount, book_copies(books(title))",
          )
          .eq("user_id", user.id)
          .in("status", ["active", "overdue"])
          .order("due_date"),
      ]);

      const out: Notification[] = [];

      (holds.data ?? []).forEach((h: any) => {
        const title = h.books?.title ?? "A book";
        if (h.status === "fulfilled") {
          out.push({
            id: `hold-${h.id}`,
            title: "Hold ready for pickup",
            body: `"${title}" is waiting for you.`,
            href: "/catalog",
            tone: "success",
          });
        } else {
          out.push({
            id: `hold-${h.id}`,
            title: "Hold placed",
            body: `"${title}" is awaiting availability.`,
            href: "/catalog",
            tone: "info",
          });
        }
      });

      (loans.data ?? []).forEach((l: any) => {
        const title = l.book_copies?.books?.title ?? "A book";
        if (l.status === "overdue") {
          out.push({
            id: `loan-${l.id}`,
            title: "Loan overdue",
            body: `"${title}" is past its due date.`,
            href: "/profile",
            tone: "danger",
          });
        } else {
          const due = new Date(l.due_date).getTime();
          const days = Math.ceil((due - Date.now()) / 86400000);
          if (days <= 3) {
            out.push({
              id: `loan-${l.id}`,
              title: "Due soon",
              body: `"${title}" is due ${relativeTime(l.due_date)}.`,
              href: "/profile",
              tone: "info",
            });
          }
        }
      });

      return out;
    },
  });

  // Which notification keys has this user already seen?
  const { data: readKeys = new Set<string>() } = useQuery({
    queryKey: ["notificationReads", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_reads")
        .select("key")
        .eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: { key: string }) => r.key));
    },
  });

  // Mark every currently visible notification as read when the bell is opened.
  const markRead = useMutation({
    mutationFn: async () => {
      if (items.length === 0) return;
      await supabase.from("notification_reads").upsert(
        items.map((n) => ({ user_id: user.id, key: n.id })),
        { onConflict: "user_id,key" },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationReads", user.id] });
    },
  });

  const unread = items.filter((n) => !readKeys.has(n.id));
  const count = unread.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-500/10 dark:text-ink-300"
        aria-label={`Notifications${count ? ` (${count} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setOpen(false)}
              aria-hidden
              tabIndex={-1}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute right-0 z-20 mt-2 w-80 rounded-xl p-2"
              role="menu"
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="font-serif text-sm font-bold text-ink-800 dark:text-ivory">
                  Notifications
                </p>
                {count > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-mist">{count} unread</span>
                    <button
                      onClick={() => markRead.mutate()}
                      className="text-[11px] font-medium text-gold-600 transition-colors hover:underline dark:text-gold-300"
                      aria-label="Mark all notifications as read"
                    >
                      Mark all read
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-mist">All read</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {count === 0 && items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                    <Bell className="size-6 text-mist/50" />
                    <p className="text-xs text-mist">You're all caught up.</p>
                  </div>
                ) : (
                  items.map((n) => {
                    const Icon = toneIcon[n.tone];
                    const read = readKeys.has(n.id);
                    return (
                      <Link
                        key={n.id}
                        to={n.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gold-400/10",
                          read && "opacity-55",
                        )}
                        role="menuitem"
                      >
                        <Icon className={cn("mt-0.5 size-4 shrink-0", toneClass[n.tone])} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-800 dark:text-ivory">
                            {n.title}
                          </p>
                          <p className="truncate text-xs text-mist">{n.body}</p>
                        </div>
                        {!read && (
                          <span className="ml-auto mt-1.5 size-2 shrink-0 rounded-full bg-gold-500" aria-label="Unread" />
                        )}
                      </Link>
                    );
                  })
                )}
              </div>

              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg border-t border-gold-400/10 px-3 py-2.5 text-center text-xs font-medium text-gold-600 transition-colors hover:bg-gold-400/10 dark:text-gold-300"
              >
                View your account
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
