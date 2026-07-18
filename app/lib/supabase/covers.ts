import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Book cover resolution.
 *
 * `books.cover_url` may hold either an absolute URL (e.g. an Open Library
 * cover) or a path inside the `Books` storage bucket (e.g. `cover-1.jpg`).
 * This helper normalises both into a URL the browser can render.
 */

export const BOOK_COVER_BUCKET = "Books";

export function resolveBookCover(
  coverUrl: string | null | undefined,
): string | null {
  if (!coverUrl) return null;

  // Already an absolute URL — use as-is.
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;

  // Storage path — build the public object URL.
  const base =
    typeof window !== "undefined" ? window.ENV?.SUPABASE_URL : undefined;
  if (!base) return coverUrl;

  return `${base}/storage/v1/object/public/${BOOK_COVER_BUCKET}/${encodeURIComponent(
    coverUrl,
  )}`;
}

/**
 * Uploads a cover image into the `Books` storage bucket and returns the
 * stored object path (e.g. `uploads/1699...-my-book.jpg`). Store this path in
 * `books.cover_url`; `resolveBookCover` turns it into a public URL.
 */
export async function uploadBookCover(
  client: SupabaseClient,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { error } = await client.storage
    .from(BOOK_COVER_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  return path;
}
