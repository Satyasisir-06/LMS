import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Book cover resolution helper.
 *
 * Normalises all cover forms into distinct, high-speed WebP URLs.
 */

export const BOOK_COVER_BUCKET = "Books";

export const LOCAL_COVERS = [
  "/cover-1.webp",
  "/cover-2.webp",
  "/cover-3.webp",
  "/cover-4.webp",
  "/cover-5.webp",
  "/cover-6.webp",
  "/cover-7.webp",
  "/cover-8.webp",
];

let globalCallCount = 0;

export function getLocalFallbackCover(key?: string | number): string {
  if (!key) {
    globalCallCount = (globalCallCount + 1) % LOCAL_COVERS.length;
    return LOCAL_COVERS[globalCallCount];
  }
  if (typeof key === "number") {
    return LOCAL_COVERS[Math.abs(key) % LOCAL_COVERS.length];
  }
  let hash = 0;
  const str = String(key);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % LOCAL_COVERS.length;
  return LOCAL_COVERS[idx];
}

export function resolveBookCover(
  coverUrl: string | null | undefined,
  fallbackKey?: string | number,
): string {
  if (coverUrl && typeof coverUrl === "string") {
    const trimmed = coverUrl.trim();

    // Check for cover-1 through cover-N in filename or URL
    const match = trimmed.match(/cover-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const idx = ((num - 1) % LOCAL_COVERS.length + LOCAL_COVERS.length) % LOCAL_COVERS.length;
      return LOCAL_COVERS[idx];
    }

    // Local static public asset
    if (trimmed.startsWith("/") || trimmed.startsWith("cover-")) {
      const formatted = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      if (formatted.endsWith(".webp")) return formatted;
    }

    // Absolute HTTP/HTTPS URL that isn't openlibrary
    if (/^https?:\/\//i.test(trimmed) && !trimmed.includes("openlibrary.org")) {
      return trimmed;
    }
  }

  // Fallback: Use fallbackKey or coverUrl string or rotating call index
  return getLocalFallbackCover(fallbackKey || coverUrl || undefined);
}

/**
 * Uploads a cover image into the `Books` storage bucket and returns the
 * stored object path.
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
