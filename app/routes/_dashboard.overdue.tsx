import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlarmClock,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCheck,
  CircleDollarSign,
  Bell,
  Mail,
  X,
  RefreshCw,
  Eye,
  History,
  AlertTriangle,
  Users,
  BookOpen,
  Wallet,
  TrendingUp,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { data } from "react-router";
import type { Route } from "./+types/_dashboard.overdue";
import { requireRole } from "~/lib/auth";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { useUser } from "~/providers/app-context";
import {
  getOverdueReport,
  getOverdueSummary,
  collectFine,
  sendReminder,
  getReminderHistory,
  getDepartments,
  getCategories,
  overdueTier,
  type OverdueRow,
  type OverdueFilters,
} from "~/lib/supabase/overdue";
import { checkInCopy } from "~/lib/supabase/circulation";
import { formatDate, downloadCsv, cn } from "~/lib/utils";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { StatCard } from "~/components/dashboard/stat-card";

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, "librarian");
  return data(null);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Overdue Management · Athenaeum" }];
}

const DAY_BUCKETS: Record<string, { min?: number; max?: number }> = {
  "": {},
  "1-7": { min: 1, max: 7 },
  "8-15": { min: 8, max: 15 },
  "16-30": { min: 16, max: 30 },
  "30+": { min: 31, max: undefined },
};

const FINE_BUCKETS: Record<string, { min?: number; max?: number }> = {
  "": {},
  has: { min: 0.01 },
  none: { max: 0 },
  "0-5": { min: 0.01, max: 5 },
  "5-20": { min: 5.01, max: 20 },
  "20+": { min: 20.01 },
};

export default function OverdueManagement() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const current = useUser();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [dayBucket, setDayBucket] = useState<string>("");
  const [fineBucket, setFineBucket] = useState<string>("");

  const [studentRow, setStudentRow] = useState<OverdueRow | null>(null);
  const [fineRow, setFineRow] = useState<OverdueRow | null>(null);
  const [receipt, setReceipt] = useState<null | {
    receipt_no: string;
    student: string;
    book: string;
    amount: number;
    currency: string;
    method: string;
  }>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: OverdueFilters = useMemo(() => {
    const d = DAY_BUCKETS[dayBucket] ?? {};
    const f = FINE_BUCKETS[fineBucket] ?? {};
    return {
      search: search || undefined,
      department: department || null,
      year: year ? Number(year) : null,
      semester: semester || null,
      category: category || null,
      minDays: d.min ?? null,
      maxDays: d.max ?? null,
      minFine: f.min ?? null,
      maxFine: f.max ?? null,
      limit: 200,
      offset: 0,
    };
  }, [search, department, year, semester, category, dayBucket, fineBucket]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["overdueReport", filters],
    queryFn: () => getOverdueReport(supabase, filters),
  });

  const { data: summary } = useQuery({
    queryKey: ["overdueSummary"],
    queryFn: () => getOverdueSummary(supabase),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["overdueDepartments"],
    queryFn: () => getDepartments(supabase),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["overdueCategories"],
    queryFn: () => getCategories(supabase),
  });

  // Real-time: refetch on borrowings changes + keep data fresh.
  useEffect(() => {
    const channel = supabase
      .channel("overdue-borrowings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrowings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["overdueReport"] });
          queryClient.invalidateQueries({ queryKey: ["overdueSummary"] });
        },
      )
      .subscribe();
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["overdueReport"] });
      queryClient.invalidateQueries({ queryKey: ["overdueSummary"] });
    }, 60000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, queryClient]);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["overdueReport"] });
    queryClient.invalidateQueries({ queryKey: ["overdueSummary"] });
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const returnMutation = useMutation({
    mutationFn: (barcode: string) => checkInCopy(supabase, barcode),
    onSuccess: () => {
      flash("Book marked as returned.");
      refetch();
    },
    onError: (e: any) => flash(e.message || "Return failed."),
  });

  const remindMutation = useMutation({
    mutationFn: async (row: OverdueRow) => {
      const kind =
        row.overdue_days > 0 ? "overdue_daily" : row.overdue_days === 0 ? "due" : "pre_due";
      await sendReminder(
        supabase,
        row.borrowing_id,
        kind,
        "in_app",
        `Reminder: "${row.book_title}" is ${row.overdue_days > 0 ? "overdue" : "due"}.`,
      );
      // External channels are dispatched by the send-reminders edge function
      // when providers (email/SMS/WhatsApp) are configured.
      await sendReminder(
        supabase,
        row.borrowing_id,
        kind,
        "email",
        `Reminder: "${row.book_title}" is ${row.overdue_days > 0 ? "overdue" : "due"}.`,
      );
    },
    onSuccess: () => flash("Reminder sent (in-app + email queued)."),
    onError: (e: any) => flash(e.message || "Reminder failed."),
  });

  const fineMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      method,
    }: {
      id: string;
      amount: number;
      method: string;
    }) =>
      collectFine(supabase, id, amount, method, current.id),
    onSuccess: (res, vars) => {
      setFineRow(null);
      setReceipt({
        receipt_no: res.receipt_no,
        student: fineRow?.full_name ?? "Member",
        book: fineRow?.book_title ?? "",
        amount: vars.amount,
        currency: res.currency,
        method: vars.method,
      });
      refetch();
    },
    onError: (e: any) => flash(e.message || "Fine collection failed."),
  });

  // ── Exports ──────────────────────────────────────────────────────────────────
  const exportRows = rows.map((r) => ({
    "Student Name": r.full_name ?? "—",
    "Roll Number": r.student_id ?? "—",
    Department: r.department ?? "—",
    "Year/Semester": `${r.academic_year ?? "—"}${r.semester ? " · " + r.semester : ""}`,
    "Book Title": r.book_title ?? "—",
    "Book ID": r.book_id ?? "—",
    "Issue Date": formatDate(r.issue_date),
    "Due Date": formatDate(r.due_date),
    "Overdue Days": r.overdue_days,
    "Fine Amount": Number(r.fine_amount).toFixed(2),
    Status: overdueTier(r.overdue_days).label,
  }));

  const exportCsv = () => downloadCsv("athenaeum-overdue.csv", exportRows);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Overdue");
    XLSX.writeFile(wb, "athenaeum-overdue.xlsx");
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Athenaeum — Overdue Report", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [Object.keys(exportRows[0] ?? {})],
      body: exportRows.map((r) => Object.values(r)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [203, 168, 104] },
    });
    doc.save("athenaeum-overdue.pdf");
  };

  const exportPrint = () => {
    const head = Object.keys(exportRows[0] ?? {});
    const body = exportRows
      .map(
        (r) =>
          `<tr>${Object.values(r)
            .map((v) => `<td style="border:1px solid #ccc;padding:4px">${v}</td>`)
            .join("")}</tr>`,
      )
      .join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<h2>Athenaeum — Overdue Report</h2><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr>${head
        .map((h) => `<th style="border:1px solid #ccc;padding:4px;text-align:left">${h}</th>`)
        .join("")}</tr></thead><tbody>${body}</tbody></table>`,
    );
    w.document.close();
    w.print();
  };

  return (
    <div>
      <PageHeader
        title="Overdue Management"
        subtitle="Track overdue books, calculate fines, and remind borrowers in real time."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refetch}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="size-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="size-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportPdf}>
            <FileText className="size-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportPrint}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </PageHeader>

      {/* Summary dashboard */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Overdue Books" value={summary?.total_overdue_books ?? "—"} hint={summary && summary.total_overdue_books > 0 ? "Needs attention" : "All clear"} />
        <StatCard icon={Users} label="Overdue Students" value={summary?.total_overdue_students ?? "—"} />
        <StatCard icon={Wallet} label="Pending Fine" value={summary ? `$${Number(summary.total_pending_fine).toFixed(2)}` : "—"} />
        <StatCard icon={CircleDollarSign} label="Fine Collected" value={summary ? `$${Number(summary.total_fine_collected).toFixed(2)}` : "—"} />
        <StatCard icon={TrendingUp} label="Highest Fine" value={summary ? `$${Number(summary.highest_fine).toFixed(2)}` : "—"} />
        <StatCard icon={CalendarClock} label="Due Today" value={summary?.books_due_today ?? "—"} />
        <StatCard icon={AlarmClock} label="Overdue This Week" value={summary?.books_overdue_this_week ?? "—"} />
        <StatCard icon={RotateCcw} label="Recently Returned" value={summary?.recently_returned_overdue ?? "—"} hint="Overdue & returned ≤7d" />
      </div>

      {/* Filters */}
      <GlassCard className="mt-6 p-4 border border-gold-400/20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, roll no, book title or ID…"
              className="h-10 w-full rounded-xl border border-gold-400/20 bg-white/60 pl-9 pr-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory"
            />
          </div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory">
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="h-10 rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory" />
          <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester" className="h-10 rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory" />
          <select value={dayBucket} onChange={(e) => setDayBucket(e.target.value)} className="h-10 rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory">
            <option value="">Any Overdue Days</option>
            <option value="1-7">1–7 days</option>
            <option value="8-15">8–15 days</option>
            <option value="16-30">16–30 days</option>
            <option value="30+">30+ days</option>
          </select>
          <select value={fineBucket} onChange={(e) => setFineBucket(e.target.value)} className="h-10 rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory">
            <option value="">Any Fine</option>
            <option value="has">Has fine</option>
            <option value="none">No fine</option>
            <option value="0-5">$0.01–5</option>
            <option value="5-20">$5–20</option>
            <option value="20+">$20+</option>
          </select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="mt-6 overflow-hidden border border-gold-400/20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-sm text-ink-800 dark:text-ivory">
            <thead className="bg-gold-400/5 text-xs font-bold text-mist uppercase tracking-wider border-b border-gold-400/15">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Dept</th>
                <th className="p-3">Year/Sem</th>
                <th className="p-3">Book Title</th>
                <th className="p-3">Book ID</th>
                <th className="p-3">Issued</th>
                <th className="p-3">Due</th>
                <th className="p-3 text-center">Days</th>
                <th className="p-3 text-right">Fine</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/10">
              {isLoading ? (
                <tr><td colSpan={12} className="p-8 text-center text-mist">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-mist">No records match your filters.</td></tr>
              ) : (
                rows.map((r) => {
                  const tier = overdueTier(r.overdue_days);
                  return (
                    <tr key={r.borrowing_id} className="hover:bg-gold-400/5 transition-colors">
                      <td className="p-3 font-medium">{r.full_name ?? "—"}</td>
                      <td className="p-3 font-mono text-xs">{r.student_id ?? "—"}</td>
                      <td className="p-3 text-xs text-mist">{r.department ?? "—"}</td>
                      <td className="p-3 text-xs text-mist">{`${r.academic_year ?? "—"}${r.semester ? " · " + r.semester : ""}`}</td>
                      <td className="p-3 max-w-[200px] truncate" title={r.book_title ?? ""}>{r.book_title ?? "—"}</td>
                      <td className="p-3 font-mono text-xs">{r.book_id ?? "—"}</td>
                      <td className="p-3 text-xs text-mist">{formatDate(r.issue_date)}</td>
                      <td className="p-3 text-xs">{formatDate(r.due_date)}</td>
                      <td className="p-3 text-center font-mono">{r.overdue_days}</td>
                      <td className="p-3 text-right font-mono">{Number(r.fine_amount).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", tier.className)}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button onClick={() => setStudentRow(r)} title="View profile & history" className="grid size-8 place-items-center rounded-lg border border-gold-400/20 text-gold-600 transition-colors hover:bg-gold-400/10 dark:text-gold-300">
                            <Eye className="size-4" />
                          </button>
                          <button onClick={() => remindMutation.mutate(r)} title="Send reminder" className="grid size-8 place-items-center rounded-lg border border-gold-400/20 text-sky-600 transition-colors hover:bg-sky-500/10 dark:text-sky-300">
                            <Bell className="size-4" />
                          </button>
                          <button onClick={() => returnMutation.mutate(r.book_id ?? "")} title="Mark returned" className="grid size-8 place-items-center rounded-lg border border-emerald-400/20 text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300">
                            <CheckCheck className="size-4" />
                          </button>
                          <button onClick={() => setFineRow(r)} title="Collect fine" disabled={Number(r.fine_amount) <= 0} className="grid size-8 place-items-center rounded-lg border border-gold-400/20 text-gold-600 transition-colors hover:bg-gold-400/10 disabled:opacity-40 dark:text-gold-300">
                            <CircleDollarSign className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-gold-400/10 px-4 py-3 text-xs text-mist">
          Showing {rows.length} record(s). Data refreshes automatically when books are issued, renewed, returned, or become due.
        </p>
      </GlassCard>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-gold-400/30 bg-ink-900/90 px-4 py-2.5 text-sm text-ivory shadow-elevate"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student profile + history modal */}
      <StudentModal row={studentRow} supabase={supabase} onClose={() => setStudentRow(null)} />

      {/* Collect fine modal */}
      <FineModal
        row={fineRow}
        onClose={() => setFineRow(null)}
        onCollect={(amount, method) =>
          fineMutation.mutate({ id: fineRow!.borrowing_id, amount, method })
        }
        isPending={fineMutation.isPending}
      />

      {/* Receipt modal */}
      <AnimatePresence>
        {receipt && (
          <ModalShell onClose={() => setReceipt(null)}>
            <div className="text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCheck className="size-6" />
              </div>
              <h3 className="mt-3 font-serif text-xl text-ink-800 dark:text-ivory">Fine Receipt</h3>
              <div className="mt-4 space-y-1 rounded-xl border border-gold-400/15 bg-ink-500/5 p-4 text-left text-sm">
                <p><span className="text-mist">Receipt No:</span> <span className="font-mono">{receipt.receipt_no}</span></p>
                <p><span className="text-mist">Student:</span> {receipt.student}</p>
                <p><span className="text-mist">Book:</span> {receipt.book}</p>
                <p><span className="text-mist">Method:</span> {receipt.method}</p>
                <p><span className="text-mist">Amount:</span> <span className="font-serif text-lg text-gold-600 dark:text-gold-300">{receipt.currency} {receipt.amount.toFixed(2)}</span></p>
              </div>
              <Button className="mt-4 gap-2" onClick={() => window.print()}>
                <Printer className="size-4" /> Print Receipt
              </Button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal shells ─────────────────────────────────────────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="glass-strong relative w-full max-w-lg rounded-2xl border border-gold-400/25 p-6"
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory">
          <X className="size-5" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

function StudentModal({
  row,
  supabase,
  onClose,
}: {
  row: OverdueRow | null;
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  onClose: () => void;
}) {
  const { data: history = [] } = useQuery({
    enabled: !!row,
    queryKey: ["studentHistory", row?.user_id],
    queryFn: async () => {
      if (!row) return [];
      const { data, error } = await supabase
        .from("borrowings")
        .select("id, issue_date, due_date, return_date, status, fine_amount, book_copies(books(title))")
        .eq("user_id", row.user_id)
        .order("issue_date", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const { data: reminders = [] } = useQuery({
    enabled: !!row,
    queryKey: ["studentReminders", row?.user_id],
    queryFn: () => getReminderHistory(supabase, row!.user_id),
  });

  if (!row) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="mb-4">
        <h3 className="font-serif text-xl text-ink-800 dark:text-ivory">{row.full_name}</h3>
        <p className="text-xs text-mist font-mono">{row.student_id}</p>
        <p className="mt-1 text-xs text-mist">
          {row.department ?? "—"} · Year {row.academic_year ?? "—"}{row.semester ? ` · ${row.semester}` : ""}
        </p>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ivory">
        <History className="size-4 text-gold-500" /> Borrowing History
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {history.length === 0 ? (
          <p className="text-sm text-mist">No borrowing records.</p>
        ) : (
          history.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-lg border border-gold-400/10 px-3 py-2 text-sm">
              <span className="truncate">{h.book_copies?.books?.title ?? "Book"}</span>
              <span className="ml-2 flex items-center gap-2 text-xs">
                <span className="text-mist">{formatDate(h.due_date)}</span>
                <span className={cn("rounded-full px-2 py-0.5 font-medium", h.status === "overdue" ? "bg-red-500/15 text-red-500" : h.status === "returned" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-ink-500/15 text-mist")}>
                  {h.status}
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ivory">
        <Bell className="size-4 text-gold-500" /> Reminder History
      </div>
      <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">
        {reminders.length === 0 ? (
          <p className="text-sm text-mist">No reminders sent yet.</p>
        ) : (
          reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs text-mist">
              <span className="capitalize">{r.kind.replace("_", " ")} · {r.channel}</span>
              <span>{new Date(r.sent_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </ModalShell>
  );
}

function FineModal({
  row,
  onClose,
  onCollect,
  isPending,
}: {
  row: OverdueRow | null;
  onClose: () => void;
  onCollect: (amount: number, method: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("cash");

  useEffect(() => {
    if (row) setAmount(Number(row.fine_amount).toFixed(2));
  }, [row]);

  if (!row) return null;
  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-serif text-xl text-ink-800 dark:text-ivory">Collect Fine</h3>
      <p className="mt-1 text-xs text-mist">{row.full_name} · {row.book_title}</p>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-[0.12em] text-mist">Amount ({row && "USD"})</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-[0.12em] text-mist">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-gold-400/20 bg-white/60 px-3 text-sm text-ink-800 outline-none focus:border-gold-400/50 dark:bg-ink-950/40 dark:text-ivory"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>
      <Button
        className="mt-5 w-full gap-2"
        isLoading={isPending}
        onClick={() => onCollect(Number(amount), method)}
      >
        <CircleDollarSign className="size-4" /> Collect &amp; Generate Receipt
      </Button>
    </ModalShell>
  );
}
