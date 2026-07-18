import type { SupabaseClient } from "@supabase/supabase-js";

export type Borrowing = {
  id: string;
  user_id: string;
  copy_id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: "active" | "returned" | "overdue" | "lost";
  fine_amount: number;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    student_id: string | null;
  };
  copy?: {
    barcode: string;
    shelf_location: string | null;
    books?: {
      title: string;
      cover_url: string | null;
    };
  };
};

export type Hold = {
  id: string;
  user_id: string;
  book_id: string;
  status: "pending" | "fulfilled" | "cancelled";
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    student_id: string | null;
  };
  book?: {
    title: string;
    cover_url: string | null;
  };
};

export async function checkOutCopy(
  client: SupabaseClient,
  studentId: string,
  barcode: string,
  dueDate?: string
) {
  // 1. Find profile by student_id
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, role")
    .eq("student_id", studentId)
    .single();

  if (profileError || !profile) {
    throw new Error(`Borrower with Student/Faculty ID "${studentId}" not found.`);
  }

  // 2. Find copy by barcode
  const { data: copy, error: copyError } = await client
    .from("book_copies")
    .select("id, status, book_id")
    .eq("barcode", barcode)
    .single();

  if (copyError || !copy) {
    throw new Error(`Book copy with barcode "${barcode}" not found.`);
  }

  if (copy.status !== "available" && copy.status !== "reserved") {
    throw new Error(`Book copy is currently ${copy.status} and cannot be checked out.`);
  }

  // 3. Verify borrowing limit (e.g. 5 for students, 10 for faculty)
  const { count, error: countError } = await client
    .from("borrowings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .in("status", ["active", "overdue"]);

  if (countError) throw countError;
  const limit = profile.role === "faculty" ? 10 : 5;
  if (count && count >= limit) {
    throw new Error(`Borrower has reached their borrowing limit of ${limit} active loans.`);
  }

  // 4. Create borrowing record. Faculty receive an extended loan period
  //    (28 days) versus the standard 14-day student loan. A librarian may
  //    override the due date via the Issue form.
  const issueDate = new Date();
  let finalDueDate: Date;
  if (dueDate) {
    // Parse the chosen calendar day in local time (avoids UTC off-by-one).
    finalDueDate = new Date(`${dueDate}T00:00:00`);
  } else {
    finalDueDate = new Date();
    finalDueDate.setDate(issueDate.getDate() + (profile.role === "faculty" ? 28 : 14));
  }

  const { data: borrowing, error: borrowError } = await client
    .from("borrowings")
    .insert({
      user_id: profile.id,
      copy_id: copy.id,
      issue_date: issueDate.toISOString(),
      due_date: finalDueDate.toISOString(),
      status: "active"
    })
    .select()
    .single();

  if (borrowError) throw borrowError;

  // 5. Update book copy status to borrowed
  const { error: updateCopyError } = await client
    .from("book_copies")
    .update({ status: "borrowed" })
    .eq("id", copy.id);

  if (updateCopyError) throw updateCopyError;

  // 6. If this user had a pending hold for this book, mark it as fulfilled
  await client
    .from("holds")
    .update({ status: "fulfilled" })
    .eq("user_id", profile.id)
    .eq("book_id", copy.book_id)
    .eq("status", "pending");

  return borrowing;
}

export async function checkInCopy(client: SupabaseClient, barcode: string) {
  // 1. Find book copy
  const { data: copy, error: copyError } = await client
    .from("book_copies")
    .select("id, book_id")
    .eq("barcode", barcode)
    .single();

  if (copyError || !copy) {
    throw new Error(`Book copy with barcode "${barcode}" not found.`);
  }

  // 2. Find active/overdue borrowing
  const { data: borrowing, error: borrowError } = await client
    .from("borrowings")
    .select("id, due_date, user_id")
    .eq("copy_id", copy.id)
    .in("status", ["active", "overdue"])
    .order("issue_date", { ascending: false })
    .maybeSingle();

  if (borrowError || !borrowing) {
    throw new Error(`No active borrowing record found for barcode "${barcode}".`);
  }

  // 3. Calculate overdue fine using dynamic fine settings
  const returnDate = new Date();
  const dueDate = new Date(borrowing.due_date);
  let fineAmount = 0.00;
  if (returnDate > dueDate) {
    const { data: settings } = await client
      .from("fine_settings")
      .select("daily_rate, grace_days")
      .eq("id", 1)
      .maybeSingle();

    const dailyRate = settings ? Number(settings.daily_rate) : 0.50;
    const graceDays = settings ? Number(settings.grace_days) : 0;

    const diffTime = returnDate.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysOverdue = Math.max(0, diffDays - graceDays);
    fineAmount = Number((daysOverdue * dailyRate).toFixed(2));
  }

  // 4. Update borrowing record
  const { error: updateBorrowError } = await client
    .from("borrowings")
    .update({
      return_date: returnDate.toISOString(),
      status: "returned",
      fine_amount: fineAmount
    })
    .eq("id", borrowing.id);

  if (updateBorrowError) throw updateBorrowError;

  // 5. Check if there are pending holds for this book
  const { data: hold, error: holdError } = await client
    .from("holds")
    .select("id")
    .eq("book_id", copy.book_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .maybeSingle();

  const nextStatus = hold ? "reserved" : "available";

  // 6. Update book copy status
  const { error: updateCopyError } = await client
    .from("book_copies")
    .update({ status: nextStatus })
    .eq("id", copy.id);

  if (updateCopyError) throw updateCopyError;

  return { borrowingId: borrowing.id, fineAmount, nextStatus };
}

export async function renewLoan(client: SupabaseClient, borrowingId: string) {
  // 1. Get borrowing details
  const { data: borrowing, error: borrowError } = await client
    .from("borrowings")
    .select("id, due_date, copy_id, book_copies(book_id)")
    .eq("id", borrowingId)
    .single();

  if (borrowError || !borrowing) {
    throw new Error("Borrowing record not found.");
  }

  // 2. Check if holds exist for this book
  const bookId = (borrowing.book_copies as any)?.book_id;
  if (bookId) {
    const { count, error: holdCheckError } = await client
      .from("holds")
      .select("id", { count: "exact", head: true })
      .eq("book_id", bookId)
      .eq("status", "pending");

    if (holdCheckError) throw holdCheckError;
    if (count && count > 0) {
      throw new Error("This book has pending holds and cannot be renewed.");
    }
  }

  // 3. Extend due date by 14 days
  const currentDueDate = new Date(borrowing.due_date);
  const newDueDate = new Date(currentDueDate);
  newDueDate.setDate(newDueDate.getDate() + 14);

  const { data: updated, error: updateError } = await client
    .from("borrowings")
    .update({
      due_date: newDueDate.toISOString(),
      status: newDueDate > new Date() ? "active" : "overdue"
    })
    .eq("id", borrowingId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated;
}

export async function getActiveLoans(client: SupabaseClient): Promise<Borrowing[]> {
  const { data, error } = await client
    .from("borrowings")
    .select(`
      *,
      profiles (
        full_name,
        student_id
      ),
      book_copies (
        barcode,
        shelf_location,
        books (
          title,
          cover_url
        )
      )
    `)
    .in("status", ["active", "overdue"])
    .order("due_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    profile: row.profiles,
    copy: {
      ...row.book_copies,
      books: row.book_copies?.books
    }
  }));
}

export async function getAllHolds(client: SupabaseClient): Promise<Hold[]> {
  const { data, error } = await client
    .from("holds")
    .select(`
      *,
      profiles (
        full_name,
        student_id
      ),
      books (
        title,
        cover_url
      )
    `)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    profile: row.profiles,
    book: row.books
  }));
}

export type AvailableCopy = {
  id: string;
  barcode: string;
  shelf_location: string | null;
  branch_name: string | null;
};

/** Available (lendable) copies for a given book. */
export async function getAvailableCopies(
  client: SupabaseClient,
  bookId: string,
): Promise<AvailableCopy[]> {
  const { data, error } = await client
    .from("book_copies")
    .select("id, barcode, shelf_location, branches (name)")
    .eq("book_id", bookId)
    .in("status", ["available", "reserved"])
    .order("barcode");

  if (error) throw error;

  return (data ?? []).map((c: any) => ({
    id: c.id,
    barcode: c.barcode,
    shelf_location: c.shelf_location,
    branch_name: c.branches?.name ?? null,
  }));
}

/**
 * Approve a pending hold: issue a specific copy to the requester with a
 * librarian-chosen due date, mark the copy borrowed, and fulfil the hold.
 */
export async function approveHold(
  client: SupabaseClient,
  input: { holdId: string; userId: string; copyId: string; dueDate: string },
) {
  const { holdId, userId, copyId, dueDate } = input;

  // 1. Resolve the requester's borrowing limit from their role.
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const limit = profile?.role === "faculty" ? 10 : 5;

  const { count, error: countError } = await client
    .from("borrowings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["active", "overdue"]);
  if (countError) throw countError;
  if (count && count >= limit) {
    throw new Error(`Borrower has reached their borrowing limit of ${limit}.`);
  }

  // 2. Verify the chosen copy is lendable.
  const { data: copy, error: copyError } = await client
    .from("book_copies")
    .select("id, status")
    .eq("id", copyId)
    .single();
  if (copyError || !copy) throw new Error("Selected copy not found.");
  if (copy.status !== "available" && copy.status !== "reserved") {
    throw new Error(`Copy is ${copy.status} and cannot be issued.`);
  }

  // 3. Create the borrowing with the chosen due date.
  const { data: borrowing, error: borrowError } = await client
    .from("borrowings")
    .insert({
      user_id: userId,
      copy_id: copyId,
      issue_date: new Date().toISOString(),
      due_date: dueDate,
      status: "active",
    })
    .select()
    .single();
  if (borrowError) throw borrowError;

  // 4. Mark the copy borrowed and fulfil the hold.
  const { error: updateCopyError } = await client
    .from("book_copies")
    .update({ status: "borrowed" })
    .eq("id", copyId);
  if (updateCopyError) throw updateCopyError;

  const { error: holdError } = await client
    .from("holds")
    .update({ status: "fulfilled" })
    .eq("id", holdId);
  if (holdError) throw holdError;

  return borrowing;
}
