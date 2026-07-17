import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRevalidator } from "react-router";
import { Building2, GraduationCap, IdCard, Mail, CalendarDays, CircleDollarSign, QrCode, X, Camera, Trash2, BookOpen, Heart, Sparkles, History } from "lucide-react";
import QRCode from "react-qr-code";

import type { Route } from "./+types/_dashboard.profile";
import { useUser } from "~/providers/app-context";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ROLE_LABELS } from "~/lib/supabase/types";
import { formatDate, getInitials } from "~/lib/utils";
import { getUserFines } from "~/lib/supabase/analytics";
import { getWishlist, getRecommendations } from "~/lib/supabase/library";
import { useToastStore } from "~/stores/toast-store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Profile · Athenaeum" }];
}

type DetailRow = {
  icon: typeof Mail;
  label: string;
  value: string | null;
};

export default function Profile() {
  const user = useUser();
  const profile = user.profile;
  const role = profile?.role;
  const revalidator = useRevalidator();
  const toast = useToastStore((s) => s.push);

  const [isEditing, setIsEditing] = useState(false);
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDepartment(profile?.department ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        toast("Image size should be less than 800KB for optimal performance.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        department: department || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);

    if (error) {
      toast("Error updating profile: " + error.message, "error");
    } else {
      setIsEditing(false);
      revalidator.revalidate();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setDepartment(profile?.department ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
    setIsEditing(false);
  };

  const details: DetailRow[] = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: GraduationCap, label: "Membership", value: role ? ROLE_LABELS[role] : null },
    { icon: IdCard, label: "Student ID", value: profile?.student_id ?? null },
    { icon: Building2, label: "Department", value: profile?.department ?? null },
    { icon: CalendarDays, label: "Member since", value: formatDate(profile?.created_at) },
  ];

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your membership details and reading identity."
      >
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative group size-20">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.full_name ?? "Avatar"}
                  className="size-20 rounded-full object-cover shadow-glow border border-gold-400/20"
                />
              ) : (
                <span className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 font-serif text-2xl font-semibold text-ink-950 shadow-glow">
                  {getInitials(profile?.full_name ?? user.email)}
                </span>
              )}
              {isEditing && (
                <label className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/70 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="size-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {isEditing && avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3" />
                Remove photo
              </button>
            )}
            <h2 className="mt-4 font-serif text-xl text-ink-800 dark:text-ivory">
              {profile?.full_name ?? "Member"}
            </h2>
            {role && <Badge variant="gold" className="mt-2">{ROLE_LABELS[role]}</Badge>}
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-mist">
            Account details
          </h3>
          <dl className="mt-4 divide-y divide-gold-400/10">
            {details.map(({ icon: Icon, label, value }) => {
              const isEditable = label === "Department";
              return (
                <div key={label} className="flex items-center justify-between py-3.5 gap-4">
                  <dt className="flex items-center gap-2.5 text-sm text-mist shrink-0">
                    <Icon className="size-4" />
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-ink-800 dark:text-ivory flex-1 flex justify-end">
                    {isEditing && isEditable ? (
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. English Literature"
                        className="w-full max-w-xs rounded-lg border border-gold-400/20 bg-ink-500/5 px-3 py-1.5 text-right text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-900/50 dark:text-white"
                      />
                    ) : (
                      <span>{value ?? "—"}</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </GlassCard>
      </div>

      <div className="mt-6">
        <FinesPanel />
      </div>

      <ActivityPanel />
    </div>
  );
}

function FinesPanel() {
  const user = useUser();
  const supabase = getSupabaseBrowserClient();
  const [qrOpen, setQrOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["userFines", user.id],
    queryFn: () => getUserFines(supabase, user.id),
  });

  const total = data?.total ?? 0;
  const fines = data?.fines ?? [];

  const paymentUrl = `https://pay.athenaeum.edu/fines?ref=${user.id}&amount=${total.toFixed(2)}`;

  return (
    <GlassCard className="p-6 border border-gold-400/20">
      <div className="flex items-center gap-2">
        <CircleDollarSign className="size-5 text-gold-500" />
        <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
          Fines & Payments
        </h3>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-mist">Loading…</p>
      ) : fines.length === 0 ? (
        <p className="mt-4 text-sm text-mist">
          You have no outstanding fines. Enjoy your reading.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-gold-400/5 border border-gold-400/10 px-4 py-3">
            <span className="text-sm text-mist">Total outstanding</span>
            <span className="font-serif text-xl text-ink-800 dark:text-ivory">
              ${total.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-gold-400/10">
            {fines.map((f) => (
              <div key={f.borrowing_id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {f.cover_url ? (
                    <img
                      src={f.cover_url}
                      alt={f.book_title}
                      className="size-10 rounded object-cover border border-gold-400/10"
                    />
                  ) : (
                    <div className="grid size-10 place-items-center rounded bg-ink-900">
                      <CircleDollarSign className="size-4 text-gold-500/40" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ivory">
                      {f.book_title}
                    </p>
                    <p className="text-xs text-mist">
                      Due {formatDate(f.due_date)} ·{" "}
                      <span className={f.status === "overdue" ? "text-red-500" : ""}>
                        {f.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm text-ink-800 dark:text-ivory">
                  ${f.fine_amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => setQrOpen(true)}>
            <QrCode className="size-4 text-gold-500" />
            Show payment QR
          </Button>
        </div>
      )}

      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setQrOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-parchment-100 dark:bg-ink-950 p-6 shadow-premium border border-gold-400/30 text-center">
            <button
              onClick={() => setQrOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory">
              Scan to Pay Fines
            </h3>
            <p className="mt-1 text-xs text-mist">Total due: ${total.toFixed(2)}</p>
            <div className="mt-6 inline-block rounded-xl bg-white p-4 shadow-inner border border-gold-400/20">
              <QRCode value={paymentUrl} size={160} />
            </div>
            <p className="mt-4 text-[11px] text-mist break-all">{paymentUrl}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function ActivityPanel() {
  const user = useUser();
  const supabase = getSupabaseBrowserClient();
  const [activeTab, setActiveTab] = useState<"borrowing" | "wishlist" | "recommendations">("borrowing");

  // Query 1: Borrowings
  const { data: borrowings, isLoading: isBorrowingsLoading } = useQuery({
    queryKey: ["profile-borrowings", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrowings")
        .select(`
          id,
          issue_date,
          due_date,
          return_date,
          status,
          book_copies (
            barcode,
            books (
              id,
              title,
              cover_url,
              book_authors (
                authors (
                  name
                )
              )
            )
          )
        `)
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row: any) => {
        const book = row.book_copies?.books;
        const authors = (book?.book_authors ?? [])
          .map((ba: any) => ba.authors?.name)
          .filter(Boolean)
          .join(", ");

        return {
          id: row.id,
          issueDate: row.issue_date,
          dueDate: row.due_date,
          returnDate: row.return_date,
          status: row.status as "active" | "returned" | "overdue" | "lost",
          barcode: row.book_copies?.barcode,
          bookId: book?.id,
          title: book?.title ?? "Unknown Title",
          coverUrl: book?.cover_url,
          authors: authors || "Unknown Author",
        };
      });
    },
  });

  // Query 2: Wishlist
  const { data: wishlist, isLoading: isWishlistLoading } = useQuery({
    queryKey: ["profile-wishlist", user.id],
    queryFn: () => getWishlist(supabase, user.id),
  });

  // Query 3: Recommendations
  const { data: recommendations, isLoading: isRecsLoading } = useQuery({
    queryKey: ["profile-recommendations", user.id],
    queryFn: () => getRecommendations(supabase, user.id, 4), // get top 4
  });

  return (
    <GlassCard className="mt-6 p-6 border border-gold-400/20">
      {/* Tab Triggers */}
      <div className="flex border-b border-gold-400/10 pb-px gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("borrowing")}
          className={`flex items-center gap-2 pb-4 text-xs font-semibold uppercase tracking-[0.15em] border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "borrowing"
              ? "border-gold-500 text-gold-500 font-bold"
              : "border-transparent text-mist hover:text-ink-800 dark:hover:text-ivory"
          }`}
        >
          <History className="size-4" />
          Borrowing History
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`flex items-center gap-2 pb-4 text-xs font-semibold uppercase tracking-[0.15em] border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "wishlist"
              ? "border-gold-500 text-gold-500 font-bold"
              : "border-transparent text-mist hover:text-ink-800 dark:hover:text-ivory"
          }`}
        >
          <Heart className="size-4" />
          Wishlist
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex items-center gap-2 pb-4 text-xs font-semibold uppercase tracking-[0.15em] border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "recommendations"
              ? "border-gold-500 text-gold-500 font-bold"
              : "border-transparent text-mist hover:text-ink-800 dark:hover:text-ivory"
          }`}
        >
          <Sparkles className="size-4" />
          Recommendations
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === "borrowing" && (
          <BorrowingPanel data={borrowings} loading={isBorrowingsLoading} />
        )}
        {activeTab === "wishlist" && (
          <WishlistPanel data={wishlist} loading={isWishlistLoading} />
        )}
        {activeTab === "recommendations" && (
          <RecommendationsPanel data={recommendations} loading={isRecsLoading} />
        )}
      </div>
    </GlassCard>
  );
}

function BorrowingPanel({ data, loading }: { data: any[] | undefined; loading: boolean }) {
  if (loading) return <p className="text-sm text-mist">Loading borrowing history...</p>;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <BookOpen className="size-10 text-gold-500/30 mx-auto mb-3" />
        <h4 className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory">No books borrowed yet</h4>
        <p className="text-xs text-mist mt-1 max-w-xs mx-auto">When you check out books from the library, they will appear here along with their return status.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="space-y-3 md:hidden animate-fadeIn">
        {data.map((b) => {
          const statusColors: Record<string, string> = {
            active: "bg-gold-500/10 text-gold-600 dark:text-gold-400 border-gold-500/20",
            returned: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
            overdue: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
            lost: "bg-ink-500/10 text-ink-600 dark:text-ink-400 border-ink-500/20",
          };
          return (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-xl border border-gold-400/10 bg-ink-500/5 p-3"
            >
              {b.coverUrl ? (
                <img
                  src={b.coverUrl}
                  alt={b.title}
                  className="w-10 h-14 rounded object-cover shadow border border-gold-400/10 shrink-0"
                />
              ) : (
                <div className="grid w-10 h-14 place-items-center rounded bg-ink-900 border border-gold-400/10 shrink-0">
                  <BookOpen className="size-4 text-gold-500/40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={`/catalog?book=${b.bookId}`}
                  className="block font-medium text-ink-800 dark:text-ivory hover:text-gold-500 transition-colors line-clamp-1"
                >
                  {b.title}
                </a>
                <p className="text-xs text-mist line-clamp-1">{b.authors}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist">
                  <span>Issued {formatDate(b.issueDate)}</span>
                  <span>Due {formatDate(b.dueDate)}</span>
                  {b.returnDate && <span>Returned {formatDate(b.returnDate)}</span>}
                </div>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${statusColors[b.status] || statusColors.active}`}>
                {b.status}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block -mx-6 px-6 animate-fadeIn">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gold-400/10 text-[10px] font-bold uppercase tracking-wider text-mist">
              <th className="pb-3 font-semibold">Book</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Issued</th>
              <th className="pb-3 font-semibold">Due</th>
              <th className="pb-3 font-semibold">Returned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-400/5">
            {data.map((b) => {
              const statusColors: Record<string, string> = {
                active: "bg-gold-500/10 text-gold-600 dark:text-gold-400 border-gold-500/20",
                returned: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
                overdue: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                lost: "bg-ink-500/10 text-ink-600 dark:text-ink-400 border-ink-500/20",
              };
              return (
                <tr key={b.id} className="text-sm group">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      {b.coverUrl ? (
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="w-9 h-12 rounded object-cover shadow border border-gold-400/10 shrink-0"
                        />
                      ) : (
                        <div className="grid w-9 h-12 place-items-center rounded bg-ink-900 border border-gold-400/10 shrink-0">
                          <BookOpen className="size-4 text-gold-500/40" />
                        </div>
                      )}
                      <div>
                        <a
                          href={`/catalog?book=${b.bookId}`}
                          className="font-medium text-ink-800 dark:text-ivory hover:text-gold-500 transition-colors line-clamp-1"
                        >
                          {b.title}
                        </a>
                        <p className="text-xs text-mist line-clamp-1">{b.authors}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${statusColors[b.status] || statusColors.active}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-xs text-mist font-medium">
                    {formatDate(b.issueDate)}
                  </td>
                  <td className="py-4 pr-4 text-xs text-mist font-medium">
                    {formatDate(b.dueDate)}
                  </td>
                  <td className="py-4 text-xs text-mist font-medium">
                    {b.returnDate ? formatDate(b.returnDate) : <span className="text-gold-500/40">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WishlistPanel({ data, loading }: { data: any[] | undefined; loading: boolean }) {
  if (loading) return <p className="text-sm text-mist">Loading wishlist...</p>;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 px-4 animate-fadeIn">
        <Heart className="size-10 text-gold-500/30 mx-auto mb-3" />
        <h4 className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory">Your wishlist is empty</h4>
        <p className="text-xs text-mist mt-1 max-w-xs mx-auto">Explore our catalog and save books you want to read later to your wishlist.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fadeIn">
      {data.map((w) => {
        const authors = w.authors.map((a: any) => a.name).join(", ");
        return (
          <div key={w.book_id} className="group relative flex flex-col rounded-xl bg-ink-500/5 border border-gold-400/5 p-3 hover:border-gold-400/20 transition-all duration-300">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ink-900 shadow border border-gold-400/10">
              {w.cover_url ? (
                <img
                  src={w.cover_url}
                  alt={w.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <BookOpen className="size-8 text-gold-500/20" />
                </div>
              )}
            </div>
            <h4 className="mt-3 text-xs font-semibold text-ink-800 dark:text-ivory line-clamp-1 group-hover:text-gold-500 transition-colors">
              <a href={`/catalog?book=${w.book_id}`}>{w.title}</a>
            </h4>
            <p className="text-[10px] text-mist line-clamp-1 mt-0.5">{authors || "Unknown Author"}</p>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationsPanel({ data, loading }: { data: any[] | undefined; loading: boolean }) {
  if (loading) return <p className="text-sm text-mist">Loading recommendations...</p>;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 px-4 animate-fadeIn">
        <Sparkles className="size-10 text-gold-500/30 mx-auto mb-3" />
        <h4 className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory">No recommendations yet</h4>
        <p className="text-xs text-mist mt-1 max-w-xs mx-auto">Borrow books or add titles to your wishlist to help us understand your interests and curate recommendations.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fadeIn">
      {data.map((r) => {
        const authors = r.authors.map((a: any) => a.name).join(", ");
        return (
          <div key={r.id} className="group relative flex flex-col rounded-xl bg-ink-500/5 border border-gold-400/5 p-3 hover:border-gold-400/20 transition-all duration-300">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ink-900 shadow border border-gold-400/10">
              {r.cover_url ? (
                <img
                  src={r.cover_url}
                  alt={r.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <BookOpen className="size-8 text-gold-500/20" />
                </div>
              )}
            </div>
            <h4 className="mt-3 text-xs font-semibold text-ink-800 dark:text-ivory line-clamp-1 group-hover:text-gold-500 transition-colors">
              <a href={`/catalog?book=${r.id}`}>{r.title}</a>
            </h4>
            <p className="text-[10px] text-mist line-clamp-1 mt-0.5">{authors || "Unknown Author"}</p>
          </div>
        );
      })}
    </div>
  );
}
