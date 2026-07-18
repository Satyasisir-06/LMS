import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, BookOpen, X } from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/_dashboard.wishlist";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { resolveBookCover } from "~/lib/supabase/covers";
import { useUser } from "~/providers/app-context";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { getWishlist, removeFromWishlist, type WishlistItem } from "~/lib/supabase/library";
import { staggerContainer, fadeUp, viewportOnce } from "~/components/motion/presets";
import { useToastStore } from "~/stores/toast-store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Wishlist · Athenaeum" }];
}

export default function Wishlist() {
  const user = useUser();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist", user.id],
    queryFn: () => getWishlist(supabase, user.id),
  });

  const toast = useToastStore((s) => s.push);
  const removeMutation = useMutation({
    mutationFn: (bookId: string) => removeFromWishlist(supabase, user.id, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlistIds", user.id] });
      toast("Removed from your wishlist.", "info");
    },
  });

  return (
    <div>
      <PageHeader
        title="Your Wishlist"
        subtitle="Titles you've saved for later. Place a hold any time."
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center">
          <Heart className="size-12 text-mist/60" />
          <h3 className="mt-4 text-lg font-medium text-ink-800 dark:text-ivory">
            Your wishlist is empty
          </h3>
          <p className="mt-2 text-sm text-mist">
            Browse the catalog and tap the heart to save titles here.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item: WishlistItem) => (
            <motion.div key={item.book_id} variants={fadeUp}>
              <GlassCard className="flex h-full items-center gap-4 p-4 border border-gold-400/20">
                <div className="relative w-14 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-ink-800 border border-parchment-300 dark:border-ink-700">
                  {resolveBookCover(item.cover_url) ? (
                    <img src={resolveBookCover(item.cover_url) ?? ""} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
                      <BookOpen className="size-5 text-gold-400/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif font-bold text-ink-800 dark:text-ivory">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-mist">
                    {item.authors.map((a) => a.name).join(", ") || "Unknown author"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      to="/catalog"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-200 via-gold-400 to-gold-500 px-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:brightness-105"
                    >
                      Place Hold
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(item.book_id)}
                      isLoading={removeMutation.isPending}
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
