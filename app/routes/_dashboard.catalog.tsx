import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, BookOpen, MapPin, X, Bookmark, BookmarkCheck, Calendar, Globe, Building2, Tag, Heart, Download } from "lucide-react";

import type { Route } from "./+types/_dashboard.catalog";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { staggerContainer, fadeUp, viewportOnce } from "~/components/motion/presets";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { getBooks, getCategories, getBranches, placeHold, getUserHolds, type Book } from "~/lib/supabase/catalog";
import { resolveBookCover } from "~/lib/supabase/covers";
import { getWishlistBookIds, addToWishlist, removeFromWishlist, getEbook, getEbookSignedUrl } from "~/lib/supabase/library";
import { useUser } from "~/providers/app-context";
import { ErrorState } from "~/components/ui/error-state";
import { Skeleton } from "~/components/ui/skeleton";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Catalog · Athenaeum" }];
}

export default function Catalog() {
  const user = useUser();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const bookParam = searchParams.get("book");

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [holdSuccessMessage, setHoldSuccessMessage] = useState<string | null>(null);
  const [holdErrorMessage, setHoldErrorMessage] = useState<string | null>(null);

  // Deep-link support: open a book's detail modal when arriving via
  // /catalog?book=<id> (links from Profile / Wishlist). The effect runs after
  // the `books` query below has populated.
  // (Effect body is defined after the books query declaration.)

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(supabase),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(supabase),
  });

  const {
    data: books = [],
    isLoading: isLoadingBooks,
    isError: isErrorBooks,
    error: errorBooks,
  } = useQuery({
    queryKey: ["books", searchTerm, selectedCategory, selectedBranch],
    queryFn: () =>
      getBooks(supabase, {
        query: searchTerm || undefined,
        category: selectedCategory || undefined,
        branchId: selectedBranch || undefined,
      }),
  });

  // Deep-link support: open a book's detail modal when arriving via
  // /catalog?book=<id> (links from Profile / Wishlist).
  useEffect(() => {
    if (!bookParam) return;
    if (books.length === 0) return;
    const found = books.find((b) => b.id === bookParam);
    if (found) {
      setSelectedBook(found);
      setHoldSuccessMessage(null);
      setHoldErrorMessage(null);
      if (searchParams.has("book")) {
        searchParams.delete("book");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [bookParam, books, searchParams, setSearchParams]);

  const { data: userHolds = [], refetch: refetchHolds } = useQuery({
    queryKey: ["userHolds", user.id],
    queryFn: () => getUserHolds(supabase, user.id),
  });

  const {
    data: wishlistIds = [],
    refetch: refetchWishlist,
  } = useQuery({
    queryKey: ["wishlistIds", user.id],
    queryFn: () => getWishlistBookIds(supabase, user.id),
  });

  // Hold Mutation (optimistic: flip the pending state immediately)
  const holdMutation = useMutation({
    mutationFn: (bookId: string) => placeHold(supabase, user.id, bookId),
    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: ["userHolds", user.id] });
      const prev = queryClient.getQueryData(["userHolds", user.id]);
      queryClient.setQueryData(["userHolds", user.id], (old: any[] = []) =>
        old.some((h) => h.book_id === bookId)
          ? old
          : [...old, { book_id: bookId, status: "pending" }],
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["userHolds", user.id], ctx.prev);
      setHoldErrorMessage("Failed to place hold.");
      setHoldSuccessMessage(null);
    },
    onSuccess: () => {
      setHoldSuccessMessage("Hold successfully placed. You will be notified when it is ready.");
      setHoldErrorMessage(null);
    },
    onSettled: () => {
      refetchHolds();
    },
  });

  const handlePlaceHold = (bookId: string) => {
    holdMutation.mutate(bookId);
  };

  // Wishlist toggle mutation (optimistic: toggle the id set instantly)
  const wishlistMutation = useMutation({
    mutationFn: (bookId: string) => {
      const wished = wishlistIds.includes(bookId);
      return wished
        ? removeFromWishlist(supabase, user.id, bookId)
        : addToWishlist(supabase, user.id, bookId);
    },
    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlistIds", user.id] });
      const prev = queryClient.getQueryData(["wishlistIds", user.id]);
      queryClient.setQueryData(["wishlistIds", user.id], (old: string[] = []) =>
        old.includes(bookId) ? old.filter((x) => x !== bookId) : [...old, bookId],
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["wishlistIds", user.id], ctx.prev);
    },
    onSettled: () => {
      refetchWishlist();
    },
  });

  // eBook availability for the selected book
  const { data: ebook, isLoading: isEbookLoading } = useQuery({
    queryKey: ["ebook", selectedBook?.id],
    queryFn: () => getEbook(supabase, selectedBook!.id),
    enabled: !!selectedBook,
  });

  const handleOpenEbook = async () => {
    if (!ebook) return;
    const url = await getEbookSignedUrl(supabase, ebook.file_path);
    if (url) window.open(url, "_blank");
  };

  const getAvailableCopyCount = (book: Book) => {
    return book.copies.filter((c) => c.status === "available").length;
  };

  const hasPendingHold = (bookId: string) => {
    return userHolds.some((h) => h.book_id === bookId && h.status === "pending");
  };

  return (
    <div className="relative">
      <PageHeader
        title="Catalog"
        subtitle="Search and reserve literary works across the university libraries."
      />

      {/* Filter panel & Search */}
      <div className="mb-8 grid gap-4 md:grid-cols-12">
        <GlassCard className="flex items-center gap-3 p-2 md:col-span-8">
          <Search className="ml-3 size-5 text-mist" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author, description, or ISBN…"
            className="h-11 flex-1 bg-transparent text-sm text-ink-800 placeholder:text-mist/70 focus:outline-none dark:text-ivory"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mr-2 text-mist hover:text-ink-800 dark:hover:text-ivory"
            >
              <X className="size-4" />
            </button>
          )}
        </GlassCard>

        <GlassCard className="flex items-center gap-3 px-4 py-2 md:col-span-4">
          <MapPin className="size-4 text-mist shrink-0" />
          <select
            value={selectedBranch || ""}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
            className="h-11 w-full bg-transparent text-sm text-ink-800 focus:outline-none dark:text-ivory"
          >
            <option value="" className="bg-parchment dark:bg-ink-900">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-parchment dark:bg-ink-900">
                {b.name}
              </option>
            ))}
          </select>
        </GlassCard>
      </div>

      {/* Category Pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "primary" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          All Genres
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.name ? "primary" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.name)}
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Books Grid */}
      {isErrorBooks ? (
        <ErrorState
          message={errorBooks?.message}
          onRetry={() =>
            queryClient.invalidateQueries({
              queryKey: ["books", searchTerm, selectedCategory, selectedBranch],
            })
          }
        />
      ) : isLoadingBooks ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i} className="flex h-full flex-col gap-4 p-4">
              <div className="flex gap-4">
                <Skeleton className="size-20 rounded-lg" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </GlassCard>
          ))}
        </div>
      ) : books.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center">
          <BookOpen className="size-12 text-mist/60" />
          <h3 className="mt-4 text-lg font-medium text-ink-800 dark:text-ivory">No books found</h3>
          <p className="mt-2 text-sm text-mist">Try adjusting your filters or search queries.</p>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {books.map((book) => {
            const availCount = getAvailableCopyCount(book);
            const totalCount = book.copies.length;
            const hasHold = hasPendingHold(book.id);

            return (
              <motion.div key={book.id} variants={fadeUp}>
              <GlassCard
                interactive
                role="button"
                tabIndex={0}
                aria-label={`Open details for ${book.title}`}
                onClick={() => {
                  setSelectedBook(book);
                  setHoldSuccessMessage(null);
                  setHoldErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedBook(book);
                    setHoldSuccessMessage(null);
                    setHoldErrorMessage(null);
                  }
                }}
                className="flex h-full flex-col overflow-hidden p-4 border border-gold-400/20 shadow-premium dark:shadow-none hover:border-gold-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60"
              >
                  <div className="flex gap-4 items-start">
                    {/* Cover Preview */}
                    <div className="relative w-20 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-ink-800 shadow-lg border border-parchment-300 dark:border-ink-700">
                      {resolveBookCover(book.cover_url) ? (
                        <img
                          src={resolveBookCover(book.cover_url) ?? ""}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
                          <BookOpen className="size-6 text-gold-400/40" />
                        </div>
                      )}
                      {/* Decorative elements */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 pointer-events-none" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {book.categories.map((c) => (
                          <Badge key={c.id} variant="gold">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-serif text-base font-bold leading-tight text-ink-800 dark:text-ivory line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-xs text-mist line-clamp-1">
                        by {book.authors.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-mist/90 line-clamp-3 flex-1">
                    {book.description || "No description available."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gold-400/10 flex items-center justify-between">
                    <span className="text-[11px] text-mist flex items-center gap-1">
                      ISBN: <span className="font-mono text-ink-800 dark:text-ivory">{book.isbn}</span>
                    </span>
                    <Badge variant={availCount > 0 ? "success" : "danger"}>
                      {availCount > 0 ? `${availCount}/${totalCount} Available` : "Checked Out"}
                    </Badge>
                  </div>

                  {/* Quick hold — mobile/tablet only, so students can reserve without opening the modal */}
                  <div className="mt-3 lg:hidden">
                    {hasHold ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 cursor-default hover:bg-emerald-500/5 hover:border-emerald-500/30"
                        disabled
                      >
                        <BookmarkCheck className="size-4" />
                        Hold Requested
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full gap-2"
                        isLoading={holdMutation.isPending && holdMutation.variables === book.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceHold(book.id);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Bookmark className="size-4" />
                        Request Hold
                      </Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-parchment-100 dark:bg-ink-950 p-6 shadow-premium border border-gold-400/30 max-h-[85vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
              >
                <X className="size-5" />
              </button>

              <div className="overflow-y-auto pr-1 flex-1">
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative w-32 aspect-[2/3] shrink-0 mx-auto sm:mx-0 overflow-hidden rounded-xl bg-ink-800 shadow-2xl border border-parchment-300 dark:border-ink-700">
                    {resolveBookCover(selectedBook.cover_url) ? (
                      <img
                        src={resolveBookCover(selectedBook.cover_url) ?? ""}
                        alt={selectedBook.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
                        <BookOpen className="size-10 text-gold-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start mb-2">
                      {selectedBook.categories.map((c) => (
                        <Badge key={c.id} variant="gold">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="font-serif text-2xl font-bold leading-tight text-ink-800 dark:text-ivory">
                      {selectedBook.title}
                    </h2>
                    <p className="mt-1 text-sm text-gold-500 font-serif">
                      by {selectedBook.authors.map((a) => a.name).join(", ")}
                    </p>

                    {/* Meta info grid */}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-left">
                      <div className="flex items-center gap-2 text-mist">
                        <Building2 className="size-3.5 text-gold-500" />
                        <span>Publisher: <strong className="text-ink-800 dark:text-ivory">{selectedBook.publisher || "N/A"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-mist">
                        <Calendar className="size-3.5 text-gold-500" />
                        <span>Published: <strong className="text-ink-800 dark:text-ivory">{selectedBook.publication_year || "N/A"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-mist">
                        <Tag className="size-3.5 text-gold-500" />
                        <span>Edition: <strong className="text-ink-800 dark:text-ivory">{selectedBook.edition || "Classic"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-mist">
                        <Globe className="size-3.5 text-gold-500" />
                        <span>Language: <strong className="text-ink-800 dark:text-ivory">{selectedBook.language}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Author Bio */}
                {selectedBook.authors.map(
                  (a) =>
                    a.bio && (
                      <div key={a.id} className="mt-6 p-3 rounded-lg bg-gold-400/5 border border-gold-400/10">
                        <h4 className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">About the Author: {a.name}</h4>
                        <p className="mt-1 text-xs text-mist leading-relaxed">{a.bio}</p>
                      </div>
                    )
                )}

                {/* Book Description */}
                <div className="mt-6">
                  <h3 className="font-serif text-sm font-bold text-ink-800 dark:text-ivory mb-2">Description</h3>
                  <p className="text-xs text-mist leading-relaxed">
                    {selectedBook.description || "No description provided."}
                  </p>
                </div>

                {/* Copies & Availability */}
                <div className="mt-6">
                  <h3 className="font-serif text-sm font-bold text-ink-800 dark:text-ivory mb-3">Branch Copies</h3>
                  <div className="grid gap-2">
                    {selectedBook.copies.map((copy) => (
                      <div
                        key={copy.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border border-gold-400/10 bg-gold-400/5 gap-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-ink-800 dark:text-ivory">
                            {copy.branch_name}
                          </span>
                          <span className="text-[10px] text-mist">
                            Shelf: <span className="text-ink-700 dark:text-ivory/80 font-medium">{copy.shelf_location || "N/A"}</span> · Barcode: <span className="font-mono text-ink-700 dark:text-ivory/80">{copy.barcode}</span>
                          </span>
                        </div>
                        <Badge
                          variant={
                            copy.status === "available"
                              ? "success"
                              : copy.status === "borrowed"
                              ? "gold"
                              : "danger"
                          }
                        >
                          {copy.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message display */}
                {holdSuccessMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    {holdSuccessMessage}
                  </div>
                )}
                {holdErrorMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                    {holdErrorMessage}
                  </div>
                )}
              </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gold-400/10 flex flex-wrap justify-end gap-3 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBook(null)}>
                    Close
                  </Button>

                  {ebook && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      isLoading={isEbookLoading}
                      onClick={handleOpenEbook}
                    >
                      <Download className="size-4 text-gold-500" />
                      Read / Download
                    </Button>
                  )}

                  <Button
                    variant={wishlistIds.includes(selectedBook.id) ? "subtle" : "outline"}
                    size="sm"
                    className="gap-2"
                    isLoading={wishlistMutation.isPending}
                    onClick={() => wishlistMutation.mutate(selectedBook.id)}
                  >
                    <Heart
                      className={`size-4 ${wishlistIds.includes(selectedBook.id) ? "fill-gold-500 text-gold-500" : "text-gold-500"}`}
                    />
                    {wishlistIds.includes(selectedBook.id) ? "Wishlisted" : "Wishlist"}
                  </Button>

                  {hasPendingHold(selectedBook.id) ? (
                    <Button variant="outline" size="sm" className="gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 cursor-default hover:bg-emerald-500/5 hover:border-emerald-500/30">
                      <BookmarkCheck className="size-4" />
                      Hold Requested
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-2"
                      isLoading={holdMutation.isPending}
                      onClick={() => handlePlaceHold(selectedBook.id)}
                    >
                      <Bookmark className="size-4" />
                      Request Hold
                    </Button>
                  )}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
