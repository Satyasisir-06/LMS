import type { SupabaseClient } from "@supabase/supabase-js";

export type Book = {
  id: string;
  title: string;
  isbn: string;
  description: string | null;
  publisher: string | null;
  language: string;
  edition: string | null;
  publication_year: number | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  authors: Array<{ id: string; name: string; bio: string | null }>;
  categories: Array<{ id: string; name: string }>;
  copies: Array<{
    id: string;
    book_id: string;
    branch_id: string;
    branch_name?: string;
    barcode: string;
    shelf_location: string | null;
    condition: string;
    status: "available" | "borrowed" | "reserved" | "lost" | "damaged";
  }>;
};

export async function getCategories(client: SupabaseClient) {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBranches(client: SupabaseClient) {
  const { data, error } = await client
    .from("branches")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getAuthors(client: SupabaseClient) {
  const { data, error } = await client
    .from("authors")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBooks(
  client: SupabaseClient,
  filters?: { query?: string; category?: string; branchId?: string }
): Promise<Book[]> {
  // Query books with authors, categories, copies, and the copy branch name
  let query = client.from("books").select(`
    *,
    book_authors (
      authors (*)
    ),
    book_categories (
      categories (*)
    ),
    book_copies (
      *,
      branches (name)
    )
  `);

  const { data, error } = await query;
  if (error) throw error;

  let books = (data ?? []).map((b: any) => {
    const authors = b.book_authors?.map((ba: any) => ba.authors).filter(Boolean) ?? [];
    const categories = b.book_categories?.map((bc: any) => bc.categories).filter(Boolean) ?? [];
    const copies = b.book_copies?.map((c: any) => ({
      ...c,
      branch_name: c.branches?.name
    })) ?? [];

    return {
      ...b,
      authors,
      categories,
      copies
    };
  });

  // Client-side filtering for simplicity and robust full-text search across joins
  if (filters) {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          b.authors.some((a: any) => a.name.toLowerCase().includes(q))
      );
    }

    if (filters.category) {
      books = books.filter((b) =>
        b.categories.some((c: any) => c.name.toLowerCase() === filters.category!.toLowerCase())
      );
    }

    if (filters.branchId) {
      books = books.filter((b) =>
        b.copies.some((c: any) => c.branch_id === filters.branchId)
      );
    }
  }

  return books;
}

export async function getBookDetails(client: SupabaseClient, bookId: string): Promise<Book> {
  const { data, error } = await client
    .from("books")
    .select(`
      *,
      book_authors (
        authors (*)
      ),
      book_categories (
        categories (*)
      ),
      book_copies (
        *,
        branches (name)
      )
    `)
    .eq("id", bookId)
    .single();

  if (error) throw error;

  const authors = data.book_authors?.map((ba: any) => ba.authors).filter(Boolean) ?? [];
  const categories = data.book_categories?.map((bc: any) => bc.categories).filter(Boolean) ?? [];
  const copies = data.book_copies?.map((c: any) => ({
    ...c,
    branch_name: c.branches?.name
  })) ?? [];

  return {
    ...data,
    authors,
    categories,
    copies
  };
}

export async function placeHold(client: SupabaseClient, userId: string, bookId: string) {
  // Check if user already has an active (pending) hold for this book
  const { data: existing, error: checkError } = await client
    .from("holds")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .eq("status", "pending")
    .maybeSingle();

  if (checkError) throw checkError;
  if (existing) {
    throw new Error("You already have a pending hold for this book.");
  }

  const { data, error } = await client
    .from("holds")
    .insert({ user_id: userId, book_id: bookId, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserHolds(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("holds")
    .select(`
      *,
      books (
        title,
        cover_url
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function cancelHold(client: SupabaseClient, holdId: string) {
  const { data, error } = await client
    .from("holds")
    .update({ status: "cancelled" })
    .eq("id", holdId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Catalog management (staff write operations) ──────────────────────────────

export async function createBranch(
  client: SupabaseClient,
  input: { name: string; location: string }
) {
  const { data, error } = await client
    .from("branches")
    .insert({ name: input.name, location: input.location })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createCategory(
  client: SupabaseClient,
  input: { name: string; description?: string | null }
) {
  const { data, error } = await client
    .from("categories")
    .insert({ name: input.name, description: input.description ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createAuthor(
  client: SupabaseClient,
  input: { name: string; bio?: string | null; photo_url?: string | null }
) {
  const { data, error } = await client
    .from("authors")
    .insert({
      name: input.name,
      bio: input.bio ?? null,
      photo_url: input.photo_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type CreateBookInput = {
  title: string;
  isbn: string;
  description?: string | null;
  publisher?: string | null;
  language?: string;
  edition?: string | null;
  publication_year?: number | null;
  cover_url?: string | null;
  author_ids: string[];
  category_ids: string[];
};

export async function createBook(client: SupabaseClient, input: CreateBookInput) {
  const { author_ids, category_ids, ...bookFields } = input;

  const { data: book, error } = await client
    .from("books")
    .insert({
      ...bookFields,
      description: bookFields.description ?? null,
      publisher: bookFields.publisher ?? null,
      edition: bookFields.edition ?? null,
      publication_year: bookFields.publication_year ?? null,
      cover_url: bookFields.cover_url ?? null,
      language: bookFields.language ?? "English",
    })
    .select()
    .single();

  if (error) throw error;

  if (author_ids.length) {
    const { error: linkErr } = await client
      .from("book_authors")
      .insert(author_ids.map((author_id) => ({ book_id: book.id, author_id })));
    if (linkErr) throw linkErr;
  }

  if (category_ids.length) {
    const { error: linkErr } = await client
      .from("book_categories")
      .insert(category_ids.map((category_id) => ({ book_id: book.id, category_id })));
    if (linkErr) throw linkErr;
  }

  return book;
}

export async function createCopy(
  client: SupabaseClient,
  input: {
    book_id: string;
    branch_id: string;
    barcode: string;
    shelf_location?: string | null;
    condition?: string;
  }
) {
  const { data, error } = await client
    .from("book_copies")
    .insert({
      book_id: input.book_id,
      branch_id: input.branch_id,
      barcode: input.barcode,
      shelf_location: input.shelf_location ?? null,
      condition: input.condition ?? "Good",
      status: "available",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function seedDemoData(client: SupabaseClient) {
  const { error } = await client.rpc("seed_demo_data");
  if (error) throw error;
}
