import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  Heart,
  Clock,
  Coins,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/_dashboard._index";
import { useUser } from "~/providers/app-context";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { PageHeader } from "~/components/layout/page-header";
import { StatCard } from "~/components/dashboard/stat-card";
import { GlassCard } from "~/components/ui/glass-card";
import { Badge } from "~/components/ui/badge";
import { ROLE_LABELS } from "~/lib/supabase/types";
import { formatDate } from "~/lib/utils";
import { getRecommendations, getWishlistBookIds } from "~/lib/supabase/library";
import { getUserFines } from "~/lib/supabase/analytics";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard · Athenaeum" }];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardIndex() {
  const user = useUser();
  const supabase = getSupabaseBrowserClient();
  const firstName = (user.profile?.full_name ?? user.email).split(" ")[0];

  const { data: borrowings = [] } = useQuery({
    queryKey: ["myBorrowings", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrowings")
        .select("due_date, status")
        .eq("user_id", user.id)
        .in("status", ["active", "overdue"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fines } = useQuery({
    queryKey: ["userFines", user.id],
    queryFn: () => getUserFines(supabase, user.id),
  });

  const { data: wishlistIds = [] } = useQuery({
    queryKey: ["wishlistIds", user.id],
    queryFn: () => getWishlistBookIds(supabase, user.id),
  });

  const { data: recommendations = [], isLoading: loadingRecs } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => getRecommendations(supabase, user.id, 6),
  });

  const activeLoans = borrowings.length;
  const dueSoon = borrowings.filter((b: any) => {
    const diff = new Date(b.due_date).getTime() - Date.now();
    return diff > 0 && diff < 7 * 86400000;
  }).length;
  const totalFines = fines?.total ?? 0;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={formatDate(new Date(), {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      >
        {user.profile?.role && <Badge variant="gold">{ROLE_LABELS[user.profile.role]}</Badge>}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Active loans" value={activeLoans} hint="Books in your care" delay={0.02} />
        <StatCard icon={Clock} label="Due soon" value={dueSoon} hint="Within 7 days" delay={0.08} />
        <StatCard
          icon={Coins}
          label="Outstanding fines"
          value={`$${totalFines.toFixed(2)}`}
          hint={totalFines > 0 ? "Settle in Profile" : "Account in good standing"}
          delay={0.14}
        />
        <StatCard icon={Heart} label="Wishlisted" value={wishlistIds.length} hint="Saved titles" delay={0.2} />
      </div>

      <div className="mt-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-gold-500 dark:text-gold-300">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium uppercase tracking-[0.12em]">
              Recommended for you
            </span>
          </div>

          {loadingRecs ? (
            <div className="mt-4 flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
            </div>
          ) : recommendations.length === 0 ? (
            <p className="mt-4 text-sm text-mist">
              Borrow or wishlist a few titles and we'll suggest more you'll love.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((book: any, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                >
                  <GlassCard
                    interactive
                    className="flex h-full items-center gap-4 p-4 border border-gold-400/20"
                  >
                    <div className="relative w-12 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-ink-800 border border-parchment-300 dark:border-ink-700">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
                          <BookOpen className="size-4 text-gold-400/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif font-bold text-ink-800 dark:text-ivory">
                        {book.title}
                      </p>
                      <p className="truncate text-xs text-mist">
                        {book.authors?.map((a: any) => a.name).join(", ") || "Unknown author"}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}

          <Link
            to="/catalog"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 transition-colors hover:text-gold-400 dark:text-gold-300"
          >
            Browse the full collection
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
