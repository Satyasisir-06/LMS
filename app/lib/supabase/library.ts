import type { SupabaseClient } from "@supabase/supabase-js";

// ── Wishlists ────────────────────────────────────────────────────────────────
export type WishlistItem = {
  book_id: string;
  title: string;
  cover_url: string | null;
  authors: Array<{ id: string; name: string }>;
};

export async function getWishlist(
  client: SupabaseClient,
  userId: string,
): Promise<WishlistItem[]> {
  const { data, error } = await client
    .from("wishlists")
    .select(`
      book_id,
      books (
        title,
        cover_url,
        book_authors ( authors (id, name) )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const book = row.books ?? {};
    const authors = (book.book_authors ?? []).map((ba: any) => ba.authors).filter(Boolean);
    return {
      book_id: row.book_id,
      title: book.title ?? "Unknown",
      cover_url: book.cover_url ?? null,
      authors,
    };
  });
}

export async function addToWishlist(
  client: SupabaseClient,
  userId: string,
  bookId: string,
) {
  const { error } = await client
    .from("wishlists")
    .insert({ user_id: userId, book_id: bookId });
  if (error) throw error;
}

export async function removeFromWishlist(
  client: SupabaseClient,
  userId: string,
  bookId: string,
) {
  const { error } = await client
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) throw error;
}

export async function getWishlistBookIds(
  client: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("wishlists")
    .select("book_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.book_id as string);
}

// ── Recommendations ────────────────────────────────────────────────────────────
// Books sharing categories with the member's borrowed/held books, excluding
// titles they've already borrowed, held, or wishlisted.
export async function getRecommendations(
  client: SupabaseClient,
  userId: string,
  limit = 6,
): Promise<
  Array<{
    id: string;
    title: string;
    cover_url: string | null;
    authors: Array<{ id: string; name: string }>;
  }>
> {
  // 1. Gather the member's interacted book ids + their category ids.
  const [borrowed, held, wished] = await Promise.all([
    client
      .from("borrowings")
      .select("book_copies ( book_id )")
      .eq("user_id", userId),
    client.from("holds").select("book_id").eq("user_id", userId),
    client.from("wishlists").select("book_id").eq("user_id", userId),
  ]);

  const interacted = new Set<string>();
  (borrowed.data ?? []).forEach((b: any) => {
    const id = b.book_copies?.book_id;
    if (id) interacted.add(id);
  });
  (held.data ?? []).forEach((h: any) => interacted.add(h.book_id));
  (wished.data ?? []).forEach((w: any) => interacted.add(w.book_id));

  if (interacted.size === 0) return [];

  const { data: cats, error: catErr } = await client
    .from("book_categories")
    .select("category_id")
    .in("book_id", Array.from(interacted));
  if (catErr) throw catErr;

  const categoryIds = Array.from(
    new Set((cats ?? []).map((c: any) => c.category_id as string)),
  );
  if (categoryIds.length === 0) return [];

  const { data: recs, error } = await client
    .from("book_categories")
    .select(`
      book_id,
      books (
        id, title, cover_url,
        book_authors ( authors (id, name) )
      )
    `)
    .in("category_id", categoryIds);

  if (error) throw error;

  const seen = new Set<string>();
  const result: any[] = [];
  for (const row of recs ?? []) {
    const book: any = row.books;
    if (!book) continue;
    if (interacted.has(book.id)) continue;
    if (seen.has(book.id)) continue;
    seen.add(book.id);
    const authors = (book.book_authors ?? [])
      .map((ba: any) => ba.authors)
      .filter(Boolean);
    result.push({
      id: book.id,
      title: book.title,
      cover_url: book.cover_url,
      authors,
    });
    if (result.length >= limit) break;
  }

  return result;
}

// ── Transfers (inter-branch) ───────────────────────────────────────────────────
export type Transfer = {
  id: string;
  copy_id: string;
  from_branch_id: string | null;
  to_branch_id: string | null;
  requested_by: string | null;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  completed_at: string | null;
  book_title?: string;
  barcode?: string;
  to_branch_name?: string;
};

export async function transferCopy(
  client: SupabaseClient,
  copyId: string,
  toBranchId: string,
  requestedBy: string,
) {
  // Capture current branch, move the copy, and log the transfer.
  const { data: copy, error: copyErr } = await client
    .from("book_copies")
    .select("branch_id, barcode, books (title)")
    .eq("id", copyId)
    .single();
  if (copyErr || !copy) throw new Error("Copy not found.");

  const { error: moveErr } = await client
    .from("book_copies")
    .update({ branch_id: toBranchId })
    .eq("id", copyId);
  if (moveErr) throw moveErr;

  const { data: transfer, error: trErr } = await client
    .from("transfers")
    .insert({
      copy_id: copyId,
      from_branch_id: (copy as any).branch_id,
      to_branch_id: toBranchId,
      requested_by: requestedBy,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (trErr) throw trErr;

  return transfer;
}

export async function getTransfers(client: SupabaseClient): Promise<Transfer[]> {
  const { data, error } = await client
    .from("transfers")
    .select(`
      *,
      book_copies ( barcode, books (title) ),
      branches (name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    book_title: row.book_copies?.books?.title,
    barcode: row.book_copies?.barcode,
    to_branch_name: row.branches?.name,
  }));
}

// ── eBooks (digital library) ───────────────────────────────────────────────────
export async function uploadEbook(
  client: SupabaseClient,
  bookId: string,
  file: File,
  title: string,
) {
  const path = `ebooks/${bookId}.${file.name.split(".").pop() ?? "pdf"}`;

  const { error: upErr } = await client.storage
    .from("ebooks")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;

  const { error: rowErr } = await client
    .from("ebooks")
    .upsert(
      { book_id: bookId, file_path: path, format: file.type.includes("epub") ? "epub" : "pdf", title },
      { onConflict: "book_id" },
    );
  if (rowErr) throw rowErr;
}

export async function getEbook(
  client: SupabaseClient,
  bookId: string,
): Promise<{ file_path: string; format: string; title: string | null } | null> {
  const { data, error } = await client
    .from("ebooks")
    .select("file_path, format, title")
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getEbookSignedUrl(
  client: SupabaseClient,
  filePath: string,
): Promise<string | null> {
  const { data, error } = await client.storage
    .from("ebooks")
    .createSignedUrl(filePath, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
