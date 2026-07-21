import { useState, type ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked,
  Building2,
  Tags,
  PenLine,
  BookPlus,
  CopyPlus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ArrowLeftRight,
  FileText,
  Upload,
} from "lucide-react";

import { data } from "react-router";
import type { Route } from "./+types/_dashboard.manage";
import { requireRole } from "~/lib/auth";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { TextField } from "~/components/ui/text-field";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { resolveBookCover, uploadBookCover } from "~/lib/supabase/covers";
import {
  getBooks,
  getCategories,
  getBranches,
  getAuthors,
  createBranch,
  createCategory,
  createAuthor,
  createBook,
  createCopy,
  seedDemoData,
} from "~/lib/supabase/catalog";
import {
  getTransfers,
  transferCopy,
  uploadEbook,
  getEbook,
} from "~/lib/supabase/library";
import { useUser } from "~/providers/app-context";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, headers } = await requireRole(request, "librarian");
  return data({ user }, { headers });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Catalog Management · Athenaeum" }];
}

type TabType = "branches" | "categories" | "authors" | "books" | "transfers" | "ebooks";

export default function CatalogManagement() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("branches");
  const [seedState, setSeedState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["branches"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["authors"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const seedMutation = useMutation({
    mutationFn: () => seedDemoData(supabase),
    onMutate: () => {
      setSeedState("loading");
      setSeedMessage(null);
    },
    onSuccess: () => {
      invalidateAll();
      setSeedState("done");
      setSeedMessage("Demo data loaded — branches, books, and copies are ready.");
    },
    onError: (err: any) => {
      setSeedState("error");
      setSeedMessage(err.message || "Failed to load demo data.");
    },
  });

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "branches", label: "Branches", icon: Building2 },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "authors", label: "Authors", icon: PenLine },
    { id: "books", label: "Books", icon: BookMarked },
    { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
    { id: "ebooks", label: "eBooks", icon: FileText },
  ];

  return (
    <div className="relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Catalog Management"
          subtitle="Add branches, categories, authors, books, and physical copies."
        />
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => seedMutation.mutate()}
            isLoading={seedState === "loading"}
          >
            <Sparkles className="size-4 text-gold-500" />
            Load demo data
          </Button>
          {seedMessage && (
            <p
              className={`flex max-w-xs items-center gap-1.5 text-xs ${
                seedState === "error" ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {seedState === "error" ? (
                <AlertTriangle className="size-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="size-3.5 shrink-0" />
              )}
              {seedMessage}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-gold-400/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all select-none ${
                activeTab === tab.id
                  ? "border-gold-500 text-gold-500 font-bold"
                  : "border-transparent text-mist hover:text-ink-800 dark:hover:text-ivory"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "branches" && (
          <BranchesTab supabase={supabase} invalidate={invalidateAll} />
        )}
        {activeTab === "categories" && (
          <CategoriesTab supabase={supabase} invalidate={invalidateAll} />
        )}
        {activeTab === "authors" && (
          <AuthorsTab supabase={supabase} invalidate={invalidateAll} />
        )}
        {activeTab === "books" && (
          <BooksTab supabase={supabase} invalidate={invalidateAll} />
        )}
        {activeTab === "transfers" && (
          <TransfersTab supabase={supabase} invalidate={invalidateAll} />
        )}
        {activeTab === "ebooks" && (
          <EbooksTab supabase={supabase} invalidate={invalidateAll} />
        )}
      </div>
    </div>
  );
}

// ── Branches ──────────────────────────────────────────────────────────────────
function BranchesTab({
  supabase,
  invalidate,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  invalidate: () => void;
}) {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(supabase),
  });

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createBranch(supabase, { name, location }),
    onSuccess: () => {
      setName("");
      setLocation("");
      setError(null);
      invalidate();
    },
    onError: (err: any) => setError(err.message || "Failed to add branch."),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <GlassCard className="p-6 border border-gold-400/20 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
            Add Branch
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name || !location) return;
              mutation.mutate();
            }}
          >
            <TextField
              label="Branch name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Library"
            />
            <TextField
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Campus"
            />
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertTriangle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Add Branch
            </Button>
          </form>
        </GlassCard>
      </div>

      <div className="lg:col-span-7">
        <h3 className="mb-4 font-serif text-sm font-bold text-ink-800 dark:text-ivory uppercase tracking-wider flex items-center gap-2">
          <span>Existing Branches</span>
          <Badge variant="gold">{branches.length}</Badge>
        </h3>
        {isLoading ? (
          <Loader />
        ) : branches.length === 0 ? (
          <EmptyNote>No branches yet.</EmptyNote>
        ) : (
          <div className="max-h-[580px] overflow-y-auto pr-1 grid gap-3">
            {branches.map((b: any) => (
              <GlassCard key={b.id} className="flex items-center gap-4 p-4 border border-gold-400/20 hover:border-gold-400/40 transition-colors">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/10">
                  <Building2 className="size-5 text-gold-500" />
                </div>
                <div>
                  <p className="font-medium text-ink-800 dark:text-ivory">{b.name}</p>
                  <p className="text-xs text-mist">{b.location}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────
function CategoriesTab({
  supabase,
  invalidate,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  invalidate: () => void;
}) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(supabase),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createCategory(supabase, { name, description: description || null }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setError(null);
      invalidate();
    },
    onError: (err: any) => setError(err.message || "Failed to add category."),
  });

  const filteredCategories = categories.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <GlassCard className="p-6 border border-gold-400/20 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
            Add Category
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name) return;
              mutation.mutate();
            }}
          >
            <TextField
              label="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fiction"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertTriangle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Add Category
            </Button>
          </form>
        </GlassCard>
      </div>

      <div className="lg:col-span-7">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif text-sm font-bold text-ink-800 dark:text-ivory uppercase tracking-wider flex items-center gap-2">
            <span>Existing Categories</span>
            <Badge variant="gold">{filteredCategories.length}</Badge>
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gold-400/20 bg-white/60 px-3.5 py-1.5 text-xs text-ink-800 outline-none focus:border-gold-400/60 dark:bg-ink-900/60 dark:text-ivory placeholder:text-mist"
            />
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : filteredCategories.length === 0 ? (
          <EmptyNote>No categories match your search.</EmptyNote>
        ) : (
          <div className="max-h-[580px] overflow-y-auto pr-1 flex flex-wrap gap-2">
            {filteredCategories.map((c: any) => (
              <Badge key={c.id} variant="gold" className="px-3.5 py-2 text-sm border border-gold-400/30">
                {c.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Authors ───────────────────────────────────────────────────────────────────
function AuthorsTab({
  supabase,
  invalidate,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  invalidate: () => void;
}) {
  const { data: authors = [], isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: () => getAuthors(supabase),
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createAuthor(supabase, { name, bio: bio || null }),
    onSuccess: () => {
      setName("");
      setBio("");
      setError(null);
      invalidate();
    },
    onError: (err: any) => setError(err.message || "Failed to add author."),
  });

  const filteredAuthors = authors.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.bio && a.bio.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <GlassCard className="p-6 border border-gold-400/20 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
            Add Author
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name) return;
              mutation.mutate();
            }}
          >
            <TextField
              label="Author name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Austen"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
                Biography
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Optional"
                className="w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 py-2.5 text-sm text-ink-800 transition-all placeholder:text-mist/60 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/25 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
              />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertTriangle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Add Author
            </Button>
          </form>
        </GlassCard>
      </div>

      <div className="lg:col-span-7">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif text-sm font-bold text-ink-800 dark:text-ivory uppercase tracking-wider flex items-center gap-2">
            <span>Existing Authors</span>
            <Badge variant="gold">{filteredAuthors.length}</Badge>
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gold-400/20 bg-white/60 px-3.5 py-1.5 text-xs text-ink-800 outline-none focus:border-gold-400/60 dark:bg-ink-900/60 dark:text-ivory placeholder:text-mist"
            />
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : filteredAuthors.length === 0 ? (
          <EmptyNote>No authors match your search.</EmptyNote>
        ) : (
          <div className="max-h-[580px] overflow-y-auto pr-1 grid gap-3 sm:grid-cols-2">
            {filteredAuthors.map((a: any) => (
              <GlassCard key={a.id} className="p-4 border border-gold-400/20 hover:border-gold-400/40 transition-colors">
                <p className="font-medium text-ink-800 dark:text-ivory">{a.name}</p>
                {a.bio && <p className="mt-1 line-clamp-2 text-xs text-mist">{a.bio}</p>}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Books ─────────────────────────────────────────────────────────────────────
function BooksTab({
  supabase,
  invalidate,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  invalidate: () => void;
}) {
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: () => getBooks(supabase),
  });
  const { data: authors = [] } = useQuery({
    queryKey: ["authors"],
    queryFn: () => getAuthors(supabase),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(supabase),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(supabase),
  });

  const [showBookForm, setShowBookForm] = useState(false);
  const [showCopyForm, setShowCopyForm] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBooks = books.filter((b: any) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.toLowerCase().includes(search.toLowerCase()) ||
    (b.authors && b.authors.some((a: any) => a.name.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Button
            variant={showBookForm ? "primary" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => {
              setShowBookForm((v) => !v);
              setShowCopyForm(false);
            }}
          >
            <BookPlus className="size-4" />
            Add Book
          </Button>
          <Button
            variant={showCopyForm ? "primary" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => {
              setShowCopyForm((v) => !v);
              setShowBookForm(false);
            }}
          >
            <CopyPlus className="size-4" />
            Add Copy
          </Button>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Filter catalog by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gold-400/20 bg-white/60 px-3.5 py-1.5 text-xs text-ink-800 outline-none focus:border-gold-400/60 dark:bg-ink-900/60 dark:text-ivory placeholder:text-mist"
          />
        </div>
      </div>

      <AnimatePresence>
        {showBookForm && (
          <BookForm
            supabase={supabase}
            authors={authors}
            categories={categories}
            onClose={() => setShowBookForm(false)}
            onSaved={invalidate}
          />
        )}
        {showCopyForm && (
          <CopyForm
            supabase={supabase}
            books={books}
            branches={branches}
            onClose={() => setShowCopyForm(false)}
            onSaved={invalidate}
          />
        )}
      </AnimatePresence>

      <div>
        <h3 className="mb-3 font-serif text-sm font-bold text-ink-800 dark:text-ivory uppercase tracking-wider flex items-center gap-2">
          <span>Catalog Collection</span>
          <Badge variant="gold">{filteredBooks.length}</Badge>
        </h3>
        {isLoading ? (
          <Loader />
        ) : filteredBooks.length === 0 ? (
          <EmptyNote>No books match your filter criteria.</EmptyNote>
        ) : (
          <div className="max-h-[640px] overflow-y-auto pr-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book: any) => (
              <GlassCard key={book.id} className="flex gap-3 p-4 border border-gold-400/20 hover:border-gold-400/40 transition-colors">
                <div className="relative w-14 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-ink-800 border border-parchment-300 dark:border-ink-700">
                  {resolveBookCover(book.cover_url, book.title) ? (
                    <img src={resolveBookCover(book.cover_url, book.title) ?? ""} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
                      <BookMarked className="size-5 text-gold-400/40" />
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {book.categories?.slice(0, 2).map((c: any) => (
                      <Badge key={c.id} variant="gold">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-mist">
                    {book.copies?.length ?? 0} cop
                    {book.copies?.length === 1 ? "y" : "ies"}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookForm({
  supabase,
  authors,
  categories,
  onClose,
  onSaved,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  authors: any[];
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    isbn: "",
    description: "",
    publisher: "",
    publication_year: "",
    language: "English",
    edition: "",
    cover_url: "",
  });
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleCoverFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const path = await uploadBookCover(supabase, file);
      set("cover_url", path);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload cover.");
    } finally {
      setUploading(false);
    }
  };

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    id: string,
  ) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const mutation = useMutation({
    mutationFn: () =>
      createBook(supabase, {
        title: form.title,
        isbn: form.isbn,
        description: form.description || null,
        publisher: form.publisher || null,
        edition: form.edition || null,
        cover_url: form.cover_url || null,
        language: form.language,
        publication_year: form.publication_year ? Number(form.publication_year) : null,
        author_ids: authorIds,
        category_ids: categoryIds,
      }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err: any) => setError(err.message || "Failed to add book."),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard className="mb-6 border border-gold-400/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory">
            Add Book
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title || !form.isbn) return;
            mutation.mutate();
          }}
        >
          <TextField label="Title *" value={form.title} onChange={(e) => set("title", e.target.value)} />
          <TextField label="ISBN *" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} />
          <TextField label="Publisher" value={form.publisher} onChange={(e) => set("publisher", e.target.value)} />
          <TextField
            label="Publication year"
            value={form.publication_year}
            onChange={(e) => set("publication_year", e.target.value)}
            inputMode="numeric"
          />
          <TextField label="Language" value={form.language} onChange={(e) => set("language", e.target.value)} />
          <TextField label="Edition" value={form.edition} onChange={(e) => set("edition", e.target.value)} />
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Cover
            </label>
            <div className="mt-1.5 flex items-start gap-4">
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-ink-900 border border-gold-400/10">
                {resolveBookCover(form.cover_url) ? (
                  <img
                    src={resolveBookCover(form.cover_url) ?? ""}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <Upload className="size-5 text-gold-400/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <TextField
                  label="Cover URL"
                  value={form.cover_url}
                  onChange={(e) => set("cover_url", e.target.value)}
                  placeholder="https://… or storage path"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFile}
                  />
                  <label
                    htmlFor="cover-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gold-400/20 bg-ink-950/5 px-3 py-2 text-sm font-medium text-ink-800 transition-colors hover:border-gold-400/50 hover:bg-gold-400/10 dark:bg-ink-950/40 dark:text-ink-100"
                  >
                    <Upload className="size-4" />
                    {uploading ? "Uploading…" : "Upload image"}
                  </label>
                  {form.cover_url && (
                    <button
                      type="button"
                      onClick={() => set("cover_url", "")}
                      className="rounded-xl px-3 py-2 text-sm text-mist underline-offset-2 hover:text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {uploadError && (
                  <p className="text-xs text-red-500">{uploadError}</p>
                )}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 py-2.5 text-sm text-ink-800 transition-all placeholder:text-mist/60 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/25 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-mist">Authors</p>
            <div className="flex flex-wrap gap-2">
              {authors.map((a: any) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggle(authorIds, setAuthorIds, a.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    authorIds.includes(a.id)
                      ? "border-gold-500 bg-gold-400/15 text-gold-600 dark:text-gold-300"
                      : "border-gold-400/20 text-mist hover:border-gold-400/40"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-mist">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c: any) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggle(categoryIds, setCategoryIds, c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    categoryIds.includes(c.id)
                      ? "border-gold-500 bg-gold-400/15 text-gold-600 dark:text-gold-300"
                      : "border-gold-400/20 text-mist hover:border-gold-400/40"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="sm:col-span-2 flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Create Book
            </Button>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}

function CopyForm({
  supabase,
  books,
  branches,
  onClose,
  onSaved,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  books: any[];
  branches: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [bookId, setBookId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [shelf, setShelf] = useState("");
  const [condition, setCondition] = useState("Good");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createCopy(supabase, {
        book_id: bookId,
        branch_id: branchId,
        barcode,
        shelf_location: shelf || null,
        condition,
      }),
    onSuccess: () => {
      setBarcode("");
      setShelf("");
      setError(null);
      onSaved();
    },
    onError: (err: any) => setError(err.message || "Failed to add copy."),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard className="mb-6 border border-gold-400/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory">
            Add Physical Copy
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!bookId || !branchId || !barcode) return;
            mutation.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Book *
            </label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            >
              <option value="">Select a book…</option>
              {books.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Branch *
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            >
              <option value="">Select a branch…</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="Barcode *"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. ATH-0020"
          />

          <TextField
            label="Shelf location"
            value={shelf}
            onChange={(e) => setShelf(e.target.value)}
            placeholder="e.g. FIC-A20"
          />

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            >
              {["Good", "New", "Worn", "Damaged"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="sm:col-span-2 flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Add Copy
            </Button>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}

// ── Transfers (inter-branch) ───────────────────────────────────────────────────
function TransfersTab({
  supabase,
  invalidate,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  invalidate: () => void;
}) {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: copies = [], isLoading: loadingCopies } = useQuery({
    queryKey: ["copies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_copies")
        .select("id, barcode, branch_id, books (title), branches (name)")
        .order("barcode");
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        barcode: c.barcode,
        book_title: c.books?.title ?? "Unknown",
        branch_id: c.branch_id,
        branch_name: c.branches?.name ?? "—",
      }));
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(supabase),
  });

  const { data: transfers = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => getTransfers(supabase),
  });

  const [copyId, setCopyId] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const selectedCopy = copies.find((c: any) => c.id === copyId);

  const mutation = useMutation({
    mutationFn: () => transferCopy(supabase, copyId, toBranch, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["copies"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      invalidate();
      setDone(`Copy ${selectedCopy?.barcode} moved to ${branches.find((b: any) => b.id === toBranch)?.name}.`);
      setCopyId("");
      setToBranch("");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Transfer failed.");
      setDone(null);
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <GlassCard className="p-6 border border-gold-400/20">
        <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
          Transfer a Copy
        </h3>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!copyId || !toBranch) return;
            mutation.mutate();
          }}
        >
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Copy (barcode)
            </label>
            <select
              value={copyId}
              onChange={(e) => setCopyId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            >
              <option value="">Select a copy…</option>
              {copies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.barcode} — {c.book_title} ({c.branch_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Move to branch
            </label>
            <select
              value={toBranch}
              onChange={(e) => setToBranch(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            >
              <option value="">Select a branch…</option>
              {branches
                .filter((b: any) => b.id !== selectedCopy?.branch_id)
                .map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}
          {done && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5 shrink-0" />
              {done}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={mutation.isPending}>
            Transfer Copy
          </Button>
        </form>
      </GlassCard>

      <div>
        <h3 className="mb-3 font-serif text-sm font-bold text-ink-800 dark:text-ivory uppercase tracking-wider">
          Transfer Log
        </h3>
        {loadingTransfers ? (
          <Loader />
        ) : transfers.length === 0 ? (
          <EmptyNote>No transfers yet.</EmptyNote>
        ) : (
          <div className="grid gap-3">
            {transfers.map((t: any) => (
              <GlassCard key={t.id} className="p-4 border border-gold-400/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-800 dark:text-ivory">
                    {t.book_title}
                  </p>
                  <Badge
                    variant={t.status === "completed" ? "success" : t.status === "cancelled" ? "danger" : "gold"}
                  >
                    {t.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-mist">
                  Copy {t.barcode} → {t.to_branch_name}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── eBooks (digital library) ───────────────────────────────────────────────────
function EbooksTab({
  supabase,
  invalidate,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  invalidate: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: books = [] } = useQuery({
    queryKey: ["books"],
    queryFn: () => getBooks(supabase),
  });
  const { data: ebooks = [] } = useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("book_id, title, format, books (title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        book_id: e.book_id,
        title: e.books?.title ?? e.title ?? "Unknown",
        format: e.format,
      }));
    },
  });

  const [bookId, setBookId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!bookId || !file) throw new Error("Select a book and a file.");
      const book = books.find((b: any) => b.id === bookId);
      return uploadEbook(supabase, bookId, file, book?.title ?? file.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
      setDone("eBook uploaded.");
      setBookId("");
      setFile(null);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Upload failed.");
      setDone(null);
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <GlassCard className="p-6 border border-gold-400/20">
        <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
          Upload eBook
        </h3>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              Book
            </label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
            >
              <option value="">Select a book…</option>
              {books.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
              File (PDF / EPUB)
            </label>
            <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-gold-400/15 bg-ink-950/5 px-3.5 py-3 text-sm text-ink-800 hover:border-gold-400/40 dark:bg-ink-950/40 dark:text-ink-100">
              <Upload className="size-4 text-gold-500" />
              <span className="truncate">{file ? file.name : "Choose a file…"}</span>
              <input
                type="file"
                accept="application/pdf,application/epub+zip"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}
          {done && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5 shrink-0" />
              {done}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={mutation.isPending}>
            Upload eBook
          </Button>
        </form>
      </GlassCard>

      <div>
        <h3 className="mb-3 font-serif text-sm font-bold text-ink-800 dark:text-ivory uppercase tracking-wider">
          Digital Titles ({ebooks.length})
        </h3>
        {ebooks.length === 0 ? (
          <EmptyNote>No eBooks uploaded yet.</EmptyNote>
        ) : (
          <div className="grid gap-3">
            {ebooks.map((e: any) => (
              <GlassCard key={e.book_id} className="flex items-center gap-3 p-4 border border-gold-400/20">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/10">
                  <FileText className="size-5 text-gold-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-800 dark:text-ivory">{e.title}</p>
                  <p className="text-xs uppercase text-mist">{e.format}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small shared helpers ──────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="flex h-32 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-gold-400" />
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard className="p-6 text-center text-sm text-mist">{children}</GlassCard>
  );
}
