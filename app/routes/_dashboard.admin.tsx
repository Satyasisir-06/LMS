import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  BookCopy,
  AlarmClock,
  CircleDollarSign,
  Library,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Settings2,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

import { data } from "react-router";
import type { Route } from "./+types/_dashboard.admin";
import { requireRole } from "~/lib/auth";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { useUser } from "~/providers/app-context";
import { ROLE_LABELS, type UserRole } from "~/lib/supabase/types";
import { downloadCsv } from "~/lib/utils";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { StatCard } from "~/components/dashboard/stat-card";
import {
  getAdminStats,
  getPopularBooks,
  getLoansByBranch,
  getFineSettings,
  updateFineSettings,
  applyOverdueFines,
} from "~/lib/supabase/analytics";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, headers } = await requireRole(request, "admin");
  return data({ user }, { headers });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Administration · Athenaeum" }];
}

const GOLD = "#cba868";
const INK = "#3a3a3a";
const SUCCESS = "#5cb88a";
const DANGER = "#e06666";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.05 },
  }),
};

export default function Admin() {
  const supabase = getSupabaseBrowserClient();

  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStats(supabase),
  });
  const { data: popular = [] } = useQuery({
    queryKey: ["popularBooks"],
    queryFn: () => getPopularBooks(supabase, 6),
  });
  const { data: byBranch = [] } = useQuery({
    queryKey: ["loansByBranch"],
    queryFn: () => getLoansByBranch(supabase),
  });
  const { data: fineSettings } = useQuery({
    queryKey: ["fineSettings"],
    queryFn: () => getFineSettings(supabase),
  });
  const { data: members = [] } = useQuery({
    queryKey: ["adminMembers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, student_id, department, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        full_name: string | null;
        role: UserRole;
        student_id: string | null;
        department: string | null;
        created_at: string;
      }>;
    },
  });
  const { data: exportLoans = [] } = useQuery({
    queryKey: ["adminExportLoans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrowings")
        .select(
          "id, due_date, status, fine_amount, book_copies ( books (title), branches (name) ), profiles ( full_name, student_id )",
        )
        .in("status", ["active", "overdue"])
        .order("due_date");
      if (error) throw error;
      return (data ?? []) as Array<any>;
    },
  });

  const exportMembersCsv = () =>
    downloadCsv(
      "athenaeum-members.csv",
      members.map((m) => ({
        Name: m.full_name ?? "",
        StudentID: m.student_id ?? "",
        Department: m.department ?? "",
        Role: m.role,
        Joined: new Date(m.created_at).toISOString().slice(0, 10),
      })),
    );

  const exportLoansCsv = () =>
    downloadCsv(
      "athenaeum-loans.csv",
      exportLoans.map((l) => ({
        Title: l.book_copies?.books?.title ?? "",
        Branch: l.book_copies?.branches?.name ?? "",
        Borrower: l.profiles?.full_name ?? "",
        StudentID: l.profiles?.student_id ?? "",
        DueDate: new Date(l.due_date).toISOString().slice(0, 10),
        Status: l.status,
        Fine: l.fine_amount ?? 0,
      })),
    );

  const availabilityData = stats
    ? [
        { name: "Available", value: stats.availableCopies, color: SUCCESS },
        {
          name: "On loan",
          value: stats.totalCopies - stats.availableCopies,
          color: GOLD,
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Financial oversight, circulation analytics, and fine policy."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={exportMembersCsv}
          >
            <Download className="size-4" />
            Members
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={exportLoansCsv}
          >
            <Download className="size-4" />
            Loans
          </Button>
        </div>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Users} label="Members" value={stats?.members ?? "—"} />
        <StatCard icon={BookCopy} label="Active Loans" value={stats?.activeLoans ?? "—"} />
        <StatCard
          icon={AlarmClock}
          label="Overdue"
          value={stats?.overdueLoans ?? "—"}
          hint={stats && stats.overdueLoans > 0 ? "Needs attention" : "All clear"}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Outstanding Fines"
          value={stats ? `$${stats.outstandingFines.toFixed(2)}` : "—"}
        />
        <StatCard icon={Library} label="Titles" value={stats?.totalBooks ?? "—"} />
        <StatCard
          icon={CheckCircle2}
          label="Copies Available"
          value={stats ? `${stats.availableCopies}/${stats.totalCopies}` : "—"}
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6 border border-gold-400/20">
          <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
            Active Loans by Branch
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBranch}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,168,104,0.12)" />
                <XAxis
                  dataKey="branch_name"
                  tick={{ fill: "#8a8a8a", fontSize: 11 }}
                  stroke="rgba(203,168,104,0.2)"
                />
                <YAxis allowDecimals={false} tick={{ fill: "#8a8a8a", fontSize: 11 }} stroke="rgba(203,168,104,0.2)" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,20,0.92)",
                    border: "1px solid rgba(203,168,104,0.3)",
                    borderRadius: 12,
                    color: "#f5efe2",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="active_loans" fill={GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border border-gold-400/20">
          <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
            Copy Availability
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={availabilityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {availabilityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,20,0.92)",
                    border: "1px solid rgba(203,168,104,0.3)",
                    borderRadius: 12,
                    color: "#f5efe2",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-5 text-xs text-mist">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: SUCCESS }} /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: GOLD }} /> On loan
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Popular books */}
      <GlassCard className="mt-6 p-6 border border-gold-400/20">
        <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
          Most Borrowed Titles
        </h3>
        {popular.length === 0 ? (
          <p className="text-sm text-mist">No borrowing activity yet.</p>
        ) : (
          <div className="space-y-3">
            {popular.map((book, i) => {
              const max = popular[0].borrow_count || 1;
              return (
                <motion.div
                  key={book.book_id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="flex items-center gap-3"
                >
                  <span className="w-5 text-right font-serif text-sm text-gold-500">
                    {i + 1}
                  </span>
                  <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-ink-500/10">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-gold-300/70 to-gold-500/70"
                      style={{ width: `${(book.borrow_count / max) * 100}%` }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-medium text-ink-800 dark:text-ivory">
                      {book.title}
                    </span>
                  </div>
                  <span className="w-8 text-right text-xs font-mono text-mist">
                    {book.borrow_count}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Fine policy */}
      <FinePolicyCard
        supabase={supabase}
        settings={fineSettings}
      />

      {/* Members & roles */}
      <MembersCard supabase={supabase} members={members} />
    </div>
  );
}

function FinePolicyCard({
  supabase,
  settings,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  settings?: { daily_rate: number; grace_days: number; currency: string };
}) {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState<string>(settings ? String(settings.daily_rate) : "0.50");
  const [grace, setGrace] = useState<string>(settings ? String(settings.grace_days) : "0");
  const [saved, setSaved] = useState<"idle" | "ok" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setRate(String(settings.daily_rate));
      setGrace(String(settings.grace_days));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateFineSettings(supabase, {
        daily_rate: Number(rate),
        grace_days: Number(grace),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fineSettings"] });
      setSaved("ok");
      setSaveError(null);
    },
    onError: (err: any) => {
      setSaved("error");
      setSaveError(err.message || "Failed to save fine policy.");
    },
  });

  const recalcMutation = useMutation({
    mutationFn: () => applyOverdueFines(supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["loansByBranch"] });
    },
  });

  return (
    <GlassCard className="mt-6 p-6 border border-gold-400/20">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="size-5 text-gold-500" />
        <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
          Fine Policy
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Daily late fee (USD)"
          type="number"
          step="0.01"
          min="0"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
        <TextField
          label="Grace period (days)"
          type="number"
          min="0"
          value={grace}
          onChange={(e) => setGrace(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
        >
          Save Policy
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => recalcMutation.mutate()}
          isLoading={recalcMutation.isPending}
        >
          <RefreshCw className="size-4" />
          Recalculate overdue fines
        </Button>
        {saved === "ok" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" /> Policy saved
          </span>
        )}
        {saved === "error" && saveError && (
          <span className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertTriangle className="size-3.5" /> {saveError}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-mist">
        Fines also accrue automatically via the scheduled{" "}
        <code className="rounded bg-ink-500/10 px-1.5 py-0.5 font-mono">apply-overdue-fines</code>{" "}
        Edge Function.
      </p>
    </GlassCard>
  );
}

// ── Members & roles ────────────────────────────────────────────────────────────
function MembersCard({
  supabase,
  members,
}: {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  members: Array<{
    id: string;
    full_name: string | null;
    role: UserRole;
    student_id: string | null;
    department: string | null;
    created_at: string;
  }>;
}) {
  const queryClient = useQueryClient();
  const current = useUser();
  const roles: UserRole[] = ["student", "faculty", "librarian", "admin"];

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      await supabase.rpc("set_user_role", { target: id, new_role: role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMembers"] });
    },
  });

  return (
    <GlassCard className="mt-6 p-6 border border-gold-400/20">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-gold-500" />
        <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
          Members &amp; Roles
        </h3>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gold-400/20">
        <table className="w-full border-collapse text-left text-sm text-ink-800 dark:text-ivory">
          <thead className="bg-gold-400/5 text-xs font-bold text-mist uppercase tracking-wider border-b border-gold-400/15">
            <tr>
              <th className="p-4">Member</th>
              <th className="p-4">ID / Dept</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-400/10">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-mist">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const isSelf = m.id === current.id;
                return (
                  <tr key={m.id} className="hover:bg-gold-400/5 transition-colors">
                    <td className="p-4">
                      <span className="font-medium">{m.full_name ?? "—"}</span>
                      {isSelf && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-gold-500">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-mist font-mono">
                      {m.student_id ?? m.department ?? "—"}
                    </td>
                    <td className="p-4 text-xs text-mist">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={m.role}
                        disabled={isSelf || roleMutation.isPending}
                        onChange={(e) =>
                          roleMutation.mutate({ id: m.id, role: e.target.value as UserRole })
                        }
                        className="h-9 rounded-xl border border-gold-400/15 bg-ink-950/5 px-3 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none disabled:opacity-50 dark:bg-ink-950/40 dark:text-ink-100"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
