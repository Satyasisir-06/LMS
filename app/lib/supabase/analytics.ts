import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminStats = {
  members: number;
  activeLoans: number;
  overdueLoans: number;
  outstandingFines: number;
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
};

export type PopularBook = {
  book_id: string;
  title: string;
  cover_url: string | null;
  borrow_count: number;
};

export type BranchLoan = {
  branch_id: string;
  branch_name: string;
  active_loans: number;
};

export async function getAdminStats(client: SupabaseClient): Promise<AdminStats> {
  const [
    members,
    activeLoans,
    overdueLoans,
    fines,
    totalBooks,
    totalCopies,
    availableCopies,
  ] = await Promise.all([
    client.from("profiles").select("*", { count: "exact", head: true }),
    client.from("borrowings").select("*", { count: "exact", head: true }).in("status", ["active", "overdue"]),
    client.from("borrowings").select("*", { count: "exact", head: true }).eq("status", "overdue"),
    client.from("borrowings").select("fine_amount").in("status", ["active", "overdue"]),
    client.from("books").select("*", { count: "exact", head: true }),
    client.from("book_copies").select("*", { count: "exact", head: true }),
    client.from("book_copies").select("*", { count: "exact", head: true }).eq("status", "available"),
  ]);

  const outstandingFines = (fines.data ?? []).reduce(
    (sum: number, row: any) => sum + (Number(row.fine_amount) || 0),
    0,
  );

  return {
    members: members.count ?? 0,
    activeLoans: activeLoans.count ?? 0,
    overdueLoans: overdueLoans.count ?? 0,
    outstandingFines,
    totalBooks: totalBooks.count ?? 0,
    totalCopies: totalCopies.count ?? 0,
    availableCopies: availableCopies.count ?? 0,
  };
}

export async function getPopularBooks(
  client: SupabaseClient,
  limit = 5,
): Promise<PopularBook[]> {
  // Borrowings carry the copy; join through book_copies → books.
  const { data, error } = await client
    .from("borrowings")
    .select(`
      book_copies (
        books (id, title, cover_url)
      )
    `);

  if (error) throw error;

  const counts = new Map<string, PopularBook>();
  for (const row of data ?? []) {
    const book = (row.book_copies as any)?.books;
    if (!book) continue;
    const existing = counts.get(book.id);
    if (existing) {
      existing.borrow_count += 1;
    } else {
      counts.set(book.id, {
        book_id: book.id,
        title: book.title,
        cover_url: book.cover_url,
        borrow_count: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.borrow_count - a.borrow_count)
    .slice(0, limit);
}

export async function getLoansByBranch(client: SupabaseClient): Promise<BranchLoan[]> {
  const { data, error } = await client
    .from("borrowings")
    .select(`
      status,
      book_copies (
        branches (id, name)
      )
    `)
    .in("status", ["active", "overdue"]);

  if (error) throw error;

  const counts = new Map<string, BranchLoan>();
  for (const row of data ?? []) {
    const branch = (row.book_copies as any)?.branches;
    if (!branch) continue;
    const existing = counts.get(branch.id);
    if (existing) {
      existing.active_loans += 1;
    } else {
      counts.set(branch.id, {
        branch_id: branch.id,
        branch_name: branch.name,
        active_loans: 1,
      });
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.active_loans - a.active_loans);
}

export type UserFine = {
  borrowing_id: string;
  book_title: string;
  cover_url: string | null;
  due_date: string;
  status: "active" | "overdue";
  fine_amount: number;
};

export async function getUserFines(
  client: SupabaseClient,
  userId: string,
): Promise<{ fines: UserFine[]; total: number }> {
  const { data, error } = await client
    .from("borrowings")
    .select(`
      id,
      due_date,
      status,
      fine_amount,
      book_copies (
        books (title, cover_url)
      )
    `)
    .eq("user_id", userId)
    .in("status", ["active", "overdue"])
    .gt("fine_amount", 0);

  if (error) throw error;

  const fines: UserFine[] = (data ?? []).map((row: any) => ({
    borrowing_id: row.id,
    book_title: row.book_copies?.books?.title ?? "Unknown",
    cover_url: row.book_copies?.books?.cover_url ?? null,
    due_date: row.due_date,
    status: row.status,
    fine_amount: Number(row.fine_amount) || 0,
  }));

  const total = fines.reduce((sum, f) => sum + f.fine_amount, 0);
  return { fines, total };
}

// ── Fine policy (staff) ──────────────────────────────────────────────────────
export type FineSettings = {
  daily_rate: number;
  grace_days: number;
  currency: string;
};

export async function getFineSettings(client: SupabaseClient): Promise<FineSettings> {
  const { data, error } = await client.rpc("get_fine_settings");
  if (error) throw error;
  return {
    daily_rate: Number((data as any).daily_rate) ?? 0.5,
    grace_days: (data as any).grace_days ?? 0,
    currency: (data as any).currency ?? "USD",
  };
}

export async function updateFineSettings(
  client: SupabaseClient,
  input: { daily_rate: number; grace_days: number; currency?: string },
): Promise<FineSettings> {
  const { data, error } = await client.rpc("update_fine_settings", {
    p_daily_rate: input.daily_rate,
    p_grace_days: input.grace_days,
    p_currency: input.currency ?? "USD",
  });
  if (error) throw error;
  return {
    daily_rate: Number((data as any).daily_rate) ?? input.daily_rate,
    grace_days: (data as any).grace_days ?? input.grace_days,
    currency: (data as any).currency ?? "USD",
  };
}

export async function applyOverdueFines(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc("apply_overdue_fines");
  if (error) throw error;
  return data as number;
}
