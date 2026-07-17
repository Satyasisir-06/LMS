import type { SupabaseClient } from "@supabase/supabase-js";

export type OverdueRow = {
  borrowing_id: string;
  user_id: string;
  full_name: string | null;
  student_id: string | null;
  department: string | null;
  academic_year: number | null;
  semester: string | null;
  book_title: string | null;
  book_id: string | null;
  issue_date: string;
  due_date: string;
  overdue_days: number;
  fine_amount: number;
  status: string;
};

export type OverdueSummary = {
  total_overdue_books: number;
  total_overdue_students: number;
  total_fine_collected: number;
  total_pending_fine: number;
  highest_fine: number;
  books_due_today: number;
  books_overdue_this_week: number;
  recently_returned_overdue: number;
};

export type OverdueFilters = {
  search?: string;
  department?: string | null;
  year?: number | null;
  semester?: string | null;
  category?: string | null;
  minDays?: number | null;
  maxDays?: number | null;
  minFine?: number | null;
  maxFine?: number | null;
  onlyOverdue?: boolean;
  limit?: number;
  offset?: number;
};

export type ReminderRow = {
  id: string;
  borrowing_id: string | null;
  kind: "pre_due" | "due" | "overdue_daily";
  channel: "in_app" | "email" | "sms" | "whatsapp";
  message: string | null;
  sent_at: string;
};

export async function getOverdueReport(
  client: SupabaseClient,
  filters: OverdueFilters = {},
): Promise<OverdueRow[]> {
  const { data, error } = await client.rpc("get_overdue_report", {
    p_search: filters.search ?? "",
    p_department: filters.department ?? null,
    p_year: filters.year ?? null,
    p_semester: filters.semester ?? null,
    p_category: filters.category ?? null,
    p_min_days: filters.minDays ?? null,
    p_max_days: filters.maxDays ?? null,
    p_min_fine: filters.minFine ?? null,
    p_max_fine: filters.maxFine ?? null,
    p_only_overdue: filters.onlyOverdue ?? false,
    p_limit: filters.limit ?? 50,
    p_offset: filters.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as OverdueRow[];
}

export async function getOverdueSummary(
  client: SupabaseClient,
): Promise<OverdueSummary> {
  const { data, error } = await client.rpc("get_overdue_summary");
  if (error) throw error;
  return (data ?? [])[0] as OverdueSummary;
}

export async function collectFine(
  client: SupabaseClient,
  borrowingId: string,
  amount: number,
  method = "cash",
  collectedBy?: string | null,
): Promise<{ payment_id: string; receipt_no: string; currency: string }> {
  const { data, error } = await client.rpc("collect_fine", {
    p_borrowing_id: borrowingId,
    p_amount: amount,
    p_method: method,
    p_collected_by: collectedBy ?? null,
  });
  if (error) throw error;
  const row = (data ?? [])[0] as {
    payment_id: string;
    receipt_no: string;
    currency: string;
  };
  return row;
}

export async function sendReminder(
  client: SupabaseClient,
  borrowingId: string,
  kind: ReminderRow["kind"],
  channel: ReminderRow["channel"] = "in_app",
  message = "",
): Promise<string> {
  const { data, error } = await client.rpc("send_reminder", {
    p_borrowing_id: borrowingId,
    p_kind: kind,
    p_channel: channel,
    p_message: message,
  });
  if (error) throw error;
  return data as string;
}

export async function getReminderHistory(
  client: SupabaseClient,
  userId: string,
): Promise<ReminderRow[]> {
  const { data, error } = await client
    .from("reminders")
    .select("id, borrowing_id, kind, channel, message, sent_at")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as ReminderRow[];
}

export async function getDepartments(
  client: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await client
    .from("profiles")
    .select("department")
    .not("department", "is", null);
  if (error) throw error;
  return Array.from(
    new Set((data ?? []).map((r: any) => r.department).filter(Boolean)),
  ) as string[];
}

export async function getCategories(
  client: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await client.from("categories").select("name");
  if (error) throw error;
  return (data ?? []).map((r: any) => r.name).filter(Boolean) as string[];
}

/** Bucket a borrowing into a color-coded status tier (requirement 11).
 *  `days` is signed: negative = days until due, 0 = due today, positive = overdue. */
export function overdueTier(days: number): {
  label: string;
  className: string;
} {
  if (days < 0) {
    return {
      label: `DUE IN ${Math.abs(days)}D`,
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25",
    };
  }
  if (days === 0) {
    return {
      label: "DUE TODAY",
      className: "bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 border border-yellow-400/30",
    };
  }
  if (days <= 7) {
    return {
      label: "1–7 DAYS",
      className: "bg-orange-400/15 text-orange-600 dark:text-orange-300 border border-orange-400/30",
    };
  }
  if (days <= 30) {
    return {
      label: "8–30 DAYS",
      className: "bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/25",
    };
  }
  return {
    label: "30+ DAYS",
    className: "bg-red-800/25 text-red-900 dark:text-red-200 border border-red-700/40",
  };
}
