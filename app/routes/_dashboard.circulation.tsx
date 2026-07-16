import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library,
  BookOpen,
  User,
  Barcode,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  QrCode,
  ArrowRightLeft,
  Undo2,
  ListOrdered,
  X,
  Printer,
  Camera
} from "lucide-react";
import QRCode from "react-qr-code";

import { data, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/_dashboard.circulation";
import { requireRole } from "~/lib/auth";
import { PageHeader } from "~/components/layout/page-header";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import {
  checkOutCopy,
  checkInCopy,
  renewLoan,
  getActiveLoans,
  getAllHolds,
  getAvailableCopies,
  approveHold,
  type Borrowing,
  type Hold
} from "~/lib/supabase/circulation";
import { QRScanner } from "~/components/ui/qr-scanner";
import { ErrorState } from "~/components/ui/error-state";
import { Skeleton } from "~/components/ui/skeleton";
import { useToastStore } from "~/stores/toast-store";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, headers } = await requireRole(request, "librarian");
  return data({ user, origin: new URL(request.url).origin }, { headers });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Circulation · Athenaeum" }];
}

type TabType = "checkout" | "checkin" | "loans" | "holds";

export default function Circulation() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const { origin } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("checkout");

  // QR code scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"checkout-barcode" | "checkin-barcode" | null>(null);

  // checkout form state
  const [checkoutStudentId, setCheckoutStudentId] = useState("");
  const [checkoutBarcode, setCheckoutBarcode] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // checkin form state
  const [checkinBarcode, setCheckinBarcode] = useState("");
  const [checkinSuccess, setCheckinSuccess] = useState<{
    msg: string;
    fine?: number;
    nextStatus?: string;
  } | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  // Search filter for active loans & holds
  const [loansSearch, setLoansSearch] = useState("");
  const [holdsSearch, setHoldsSearch] = useState("");

  // QR Modal state
  const [qrModalLoan, setQrModalLoan] = useState<Borrowing | null>(null);

  // Hold approval state (admin chooses copy + due date)
  const [approvingHold, setApprovingHold] = useState<Hold | null>(null);
  const [approveCopy, setApproveCopy] = useState<string>("");
  const [approveDue, setApproveDue] = useState<string>("");

  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  const openApprove = (hold: Hold) => {
    setApprovingHold(hold);
    setApproveCopy("");
    setApproveDue(defaultDue);
  };

  const { data: availableCopies = [] } = useQuery({
    queryKey: ["availableCopies", approvingHold?.book_id],
    enabled: !!approvingHold,
    queryFn: () => getAvailableCopies(supabase, approvingHold!.book_id),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      approveHold(supabase, {
        holdId: approvingHold!.id,
        userId: approvingHold!.user_id,
        copyId: approveCopy,
        dueDate: new Date(approveDue).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["allHolds"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast("Hold approved and copy issued.", "success");
      setApprovingHold(null);
    },
    onError: (e: any) => toast(e.message || "Approval failed.", "error"),
  });

  // Queries
  const {
    data: activeLoans = [],
    isLoading: isLoadingLoans,
    isError: isErrorLoans,
    error: errorLoans,
  } = useQuery({
    queryKey: ["activeLoans"],
    queryFn: () => getActiveLoans(supabase),
  });

  const {
    data: allHolds = [],
    isLoading: isLoadingHolds,
    isError: isErrorHolds,
    error: errorHolds,
  } = useQuery({
    queryKey: ["allHolds"],
    queryFn: () => getAllHolds(supabase),
  });

  // Mutations
  const checkoutMutation = useMutation({
    mutationFn: ({ studentId, barcode }: { studentId: string; barcode: string }) =>
      checkOutCopy(supabase, studentId, barcode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setCheckoutSuccess(`Successfully checked out barcode "${checkoutBarcode}" to student "${checkoutStudentId}".`);
      setCheckoutError(null);
      setCheckoutBarcode("");
    },
    onError: (err: any) => {
      setCheckoutError(err.message || "Checkout failed.");
      setCheckoutSuccess(null);
    }
  });

  const checkinMutation = useMutation({
    mutationFn: (barcode: string) => checkInCopy(supabase, barcode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["allHolds"] });
      setCheckinSuccess({
        msg: `Barcode "${checkinBarcode}" successfully checked in.`,
        fine: data.fineAmount,
        nextStatus: data.nextStatus
      });
      setCheckinError(null);
      setCheckinBarcode("");
    },
    onError: (err: any) => {
      setCheckinError(err.message || "Check-in failed.");
      setCheckinSuccess(null);
    }
  });

  const renewMutation = useMutation({
    mutationFn: (borrowingId: string) => renewLoan(supabase, borrowingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      toast("Loan renewed successfully by 14 days.", "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to renew loan.", "error");
    }
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutStudentId || !checkoutBarcode) return;
    checkoutMutation.mutate({ studentId: checkoutStudentId, barcode: checkoutBarcode });
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinBarcode) return;
    checkinMutation.mutate(checkinBarcode);
  };

  const triggerScanner = (target: "checkout-barcode" | "checkin-barcode") => {
    setScannerTarget(target);
    setScannerOpen(true);
  };

  // A scanned Transaction Card QR now encodes a deep link (…?checkin=<barcode>).
  // Extract the barcode if present so both the in-app scanner and raw scans work.
  const extractBarcodeFromScan = (raw: string): string => {
    try {
      const url = new URL(raw);
      const param = url.searchParams.get("checkin");
      if (param) return param;
    } catch {
      // not a URL — treat the raw value as the barcode
    }
    return raw;
  };

  const handleScanSuccess = (raw: string) => {
    const barcode = extractBarcodeFromScan(raw);
    if (scannerTarget === "checkout-barcode") {
      setCheckoutBarcode(barcode);
    } else if (scannerTarget === "checkin-barcode") {
      setCheckinBarcode(barcode);
    }
    setScannerTarget(null);
  };

  // Deep-link support: when the page is opened via /circulation?checkin=<barcode>
  // (e.g. scanning a Transaction Card QR with a phone camera), prefill Check In.
  const consumedCheckinDeepLink = useRef(false);
  useEffect(() => {
    if (consumedCheckinDeepLink.current) return;
    consumedCheckinDeepLink.current = true;
    const barcode = searchParams.get("checkin");
    if (barcode) {
      setCheckinBarcode(barcode);
      setActiveTab("checkin");
      setSearchParams(
        (prev) => {
          prev.delete("checkin");
          return prev;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  // Filtered active loans
  const filteredLoans = activeLoans.filter((l) => {
    const term = loansSearch.toLowerCase();
    const barcode = l.copy?.barcode?.toLowerCase() ?? "";
    const name = l.profile?.full_name?.toLowerCase() ?? "";
    const sId = l.profile?.student_id?.toLowerCase() ?? "";
    const title = l.copy?.books?.title?.toLowerCase() ?? "";
    return barcode.includes(term) || name.includes(term) || sId.includes(term) || title.includes(term);
  });

  // Filtered holds
  const filteredHolds = allHolds.filter((h) => {
    const term = holdsSearch.toLowerCase();
    const name = h.profile?.full_name?.toLowerCase() ?? "";
    const sId = h.profile?.student_id?.toLowerCase() ?? "";
    const title = h.book?.title?.toLowerCase() ?? "";
    return name.includes(term) || sId.includes(term) || title.includes(term);
  });

  // Bulk selection for the active-loans table
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
  const toggleLoan = (id: string) =>
    setSelectedLoans((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allVisibleSelected =
    filteredLoans.length > 0 && filteredLoans.every((l) => selectedLoans.has(l.id));
  const toggleAllLoans = () =>
    setSelectedLoans(
      allVisibleSelected ? new Set() : new Set(filteredLoans.map((l) => l.id)),
    );

  const bulkCheckIn = useMutation({
    mutationFn: async () => {
      await Promise.all(
        [...selectedLoans].map((id) => {
          const loan = filteredLoans.find((l) => l.id === id);
          return loan?.copy?.barcode
            ? checkInCopy(supabase, loan.copy.barcode)
            : Promise.resolve();
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["allHolds"] });
      toast(`Checked in ${selectedLoans.size} item(s).`, "success");
      setSelectedLoans(new Set());
    },
    onError: (e: any) => toast(e.message || "Bulk check-in failed.", "error"),
  });

  const bulkRenew = useMutation({
    mutationFn: async () => {
      await Promise.all([...selectedLoans].map((id) => renewLoan(supabase, id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      toast(`Renewed ${selectedLoans.size} item(s).`, "success");
      setSelectedLoans(new Set());
    },
    onError: (e: any) => toast(e.message || "Bulk renew failed.", "error"),
  });

  return (
    <div>
      <PageHeader
        title="Circulation Control"
        subtitle="Manage check-outs, returns, active loans, and reservation holds."
      />

      {/* Tabs list */}
      <div className="mb-8 flex border-b border-gold-400/20 gap-2">
        {(["checkout", "checkin", "loans", "holds"] as TabType[]).map((tab) => {
          const labels: Record<TabType, string> = {
            checkout: "Issue (Check Out)",
            checkin: "Return (Check In)",
            loans: "Active Loans",
            holds: "Hold Queue"
          };
          const icons: Record<TabType, any> = {
            checkout: ArrowRightLeft,
            checkin: Undo2,
            loans: Library,
            holds: ListOrdered
          };
          const Icon = icons[tab];

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all select-none ${
                activeTab === tab
                  ? "border-gold-500 text-gold-500 font-bold"
                  : "border-transparent text-mist hover:text-ink-800 dark:hover:text-ivory"
              }`}
            >
              <Icon className="size-4" />
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {activeTab === "checkout" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
            <GlassCard className="p-6 border border-gold-400/20 shadow-premium dark:shadow-none">
              <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
                Issue Book Copy
              </h3>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-2">
                    Student or Faculty ID
                  </label>
                  <div className="relative flex items-center bg-gold-400/5 border border-gold-400/15 rounded-xl px-3 focus-within:border-gold-400/40">
                    <User className="size-4 text-mist shrink-0 mr-2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. STU12345 or FAC54321"
                      value={checkoutStudentId}
                      onChange={(e) => setCheckoutStudentId(e.target.value)}
                      className="h-11 w-full bg-transparent text-sm text-ink-800 focus:outline-none dark:text-ivory"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-2">
                    Book Copy Barcode
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center bg-gold-400/5 border border-gold-400/15 rounded-xl px-3 focus-within:border-gold-400/40">
                      <Barcode className="size-4 text-mist shrink-0 mr-2" />
                      <input
                        type="text"
                        required
                        placeholder="Scan or enter copy barcode (e.g. 97801414-2453)"
                        value={checkoutBarcode}
                        onChange={(e) => setCheckoutBarcode(e.target.value)}
                        className="h-11 w-full bg-transparent text-sm text-ink-800 focus:outline-none dark:text-ivory"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => triggerScanner("checkout-barcode")}
                      title="Scan QR/Barcode using Camera"
                      className="shrink-0"
                    >
                      <Camera className="size-5 text-gold-500" />
                    </Button>
                  </div>
                </div>

                {checkoutSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex gap-2 items-center">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{checkoutSuccess}</span>
                  </div>
                )}

                {checkoutError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex gap-2 items-center">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={checkoutMutation.isPending}
                >
                  Confirm Issue
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "checkin" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
            <GlassCard className="p-6 border border-gold-400/20 shadow-premium dark:shadow-none">
              <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory mb-4">
                Return Book Copy
              </h3>

              <form onSubmit={handleCheckinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-2">
                    Book Copy Barcode
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center bg-gold-400/5 border border-gold-400/15 rounded-xl px-3 focus-within:border-gold-400/40">
                      <Barcode className="size-4 text-mist shrink-0 mr-2" />
                      <input
                        type="text"
                        required
                        placeholder="Scan or enter copy barcode (e.g. 97801414-2453)"
                        value={checkinBarcode}
                        onChange={(e) => setCheckinBarcode(e.target.value)}
                        className="h-11 w-full bg-transparent text-sm text-ink-800 focus:outline-none dark:text-ivory"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => triggerScanner("checkin-barcode")}
                      title="Scan QR/Barcode using Camera"
                      className="shrink-0"
                    >
                      <Camera className="size-5 text-gold-500" />
                    </Button>
                  </div>
                </div>

                {checkinSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs space-y-2">
                    <div className="flex gap-2 items-center font-bold">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{checkinSuccess.msg}</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <p>Overdue Fines: <strong className="text-ink-800 dark:text-ivory">${checkinSuccess.fine?.toFixed(2)}</strong></p>
                      <p>Copy status updated to: <Badge variant={checkinSuccess.nextStatus === "reserved" ? "gold" : "success"}>{checkinSuccess.nextStatus?.toUpperCase()}</Badge></p>
                      {checkinSuccess.nextStatus === "reserved" && (
                        <p className="text-gold-600 dark:text-gold-400 font-bold mt-1">This book copy is reserved for the next pending hold user!</p>
                      )}
                    </div>
                  </div>
                )}

                {checkinError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex gap-2 items-center">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{checkinError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={checkinMutation.isPending}
                >
                  Confirm Return
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "loans" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Search */}
            <GlassCard className="flex items-center gap-3 p-2 max-w-md">
              <Search className="ml-3 size-5 text-mist" />
              <input
                type="text"
                value={loansSearch}
                onChange={(e) => setLoansSearch(e.target.value)}
                placeholder="Search active loans..."
                className="h-11 flex-1 bg-transparent text-sm text-ink-800 placeholder:text-mist/70 focus:outline-none dark:text-ivory"
              />
            </GlassCard>

            {selectedLoans.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-400/30 bg-gold-400/5 p-3"
              >
                <span className="text-sm font-medium text-ink-800 dark:text-ivory">
                  {selectedLoans.size} selected
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkRenew.mutate()}
                    isLoading={bulkRenew.isPending}
                  >
                    Renew
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => bulkCheckIn.mutate()}
                    isLoading={bulkCheckIn.isPending}
                  >
                    Check in
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLoans(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}

            {isErrorLoans ? (
              <ErrorState
                message={errorLoans?.message}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ["activeLoans"] })}
              />
            ) : isLoadingLoans ? (
              <LoansSkeleton />
            ) : filteredLoans.length === 0 ? (
              <GlassCard className="p-8 text-center text-mist">
                No active loans found matching your query.
              </GlassCard>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gold-400/20">
                <table className="w-full border-collapse text-left text-sm text-ink-800 dark:text-ivory">
                  <thead className="bg-gold-400/5 text-xs font-bold text-mist uppercase tracking-wider border-b border-gold-400/15">
                    <tr>
                      <th className="w-10 p-4">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAllLoans}
                          aria-label="Select all visible loans"
                          className="size-4 rounded border-gold-400/30 accent-gold-500"
                        />
                      </th>
                      <th className="p-4">Book Details</th>
                      <th className="p-4">Borrower</th>
                      <th className="p-4">Barcode</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-400/10">
                    {filteredLoans.map((loan) => {
                      const isOverdue = new Date(loan.due_date) < new Date();

                      return (
                        <tr key={loan.id} className="hover:bg-gold-400/5 transition-colors">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedLoans.has(loan.id)}
                              onChange={() => toggleLoan(loan.id)}
                              aria-label={`Select loan for ${loan.copy?.books?.title ?? "book"}`}
                              className="size-4 rounded border-gold-400/30 accent-gold-500"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {loan.copy?.books?.cover_url ? (
                                <img
                                  src={loan.copy.books.cover_url}
                                  alt={loan.copy.books.title}
                                  className="w-10 h-14 rounded object-cover border border-gold-400/10 shadow"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-ink-900 border border-gold-400/10 flex items-center justify-center rounded">
                                  <BookOpen className="size-4 text-gold-500/40" />
                                </div>
                              )}
                              <span className="font-serif font-bold text-sm leading-tight text-ink-800 dark:text-ivory max-w-[200px] line-clamp-2">
                                {loan.copy?.books?.title}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-ink-800 dark:text-ivory">
                                {loan.profile?.full_name}
                              </span>
                              <span className="text-xs text-mist font-mono">
                                {loan.profile?.student_id}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs">{loan.copy?.barcode}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(loan.due_date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </span>
                              <Badge variant={isOverdue ? "danger" : "neutral"} className="w-fit mt-1">
                                {isOverdue ? "OVERDUE" : "ACTIVE"}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                title="Show QR Code Card"
                                onClick={() => setQrModalLoan(loan)}
                              >
                                <QrCode className="size-4 text-gold-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => renewMutation.mutate(loan.id)}
                                isLoading={renewMutation.isPending}
                              >
                                Renew
                              </Button>
                              <Button
                                variant="subtle"
                                size="sm"
                                onClick={() => {
                                  setCheckinBarcode(loan.copy?.barcode ?? "");
                                  setActiveTab("checkin");
                                }}
                              >
                                Check In
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "holds" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Search */}
            <GlassCard className="flex items-center gap-3 p-2 max-w-md">
              <Search className="ml-3 size-5 text-mist" />
              <input
                type="text"
                value={holdsSearch}
                onChange={(e) => setHoldsSearch(e.target.value)}
                placeholder="Search holds..."
                className="h-11 flex-1 bg-transparent text-sm text-ink-800 placeholder:text-mist/70 focus:outline-none dark:text-ivory"
              />
            </GlassCard>

            {isErrorHolds ? (
              <ErrorState
                message={errorHolds?.message}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ["allHolds"] })}
              />
            ) : isLoadingHolds ? (
              <HoldsSkeleton />
            ) : filteredHolds.length === 0 ? (
              <GlassCard className="p-8 text-center text-mist">
                No reservation holds found.
              </GlassCard>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gold-400/20">
                <table className="w-full border-collapse text-left text-sm text-ink-800 dark:text-ivory">
                  <thead className="bg-gold-400/5 text-xs font-bold text-mist uppercase tracking-wider border-b border-gold-400/15">
                    <tr>
                      <th className="p-4">Book Title</th>
                      <th className="p-4">Requested By</th>
                      <th className="p-4">Request Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-400/10">
                    {filteredHolds.map((hold) => (
                      <tr key={hold.id} className="hover:bg-gold-400/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {hold.book?.cover_url ? (
                              <img
                                src={hold.book.cover_url}
                                alt={hold.book.title}
                                className="w-8 h-12 rounded object-cover border border-gold-400/10 shadow"
                              />
                            ) : (
                              <div className="w-8 h-12 bg-ink-900 border border-gold-400/10 flex items-center justify-center rounded">
                                <BookOpen className="size-3.5 text-gold-500/40" />
                              </div>
                            )}
                            <span className="font-serif font-bold text-sm leading-tight text-ink-800 dark:text-ivory max-w-[250px] line-clamp-2">
                              {hold.book?.title}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-ink-800 dark:text-ivory">
                              {hold.profile?.full_name}
                            </span>
                            <span className="text-xs text-mist font-mono">
                              {hold.profile?.student_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-mist">
                          {new Date(hold.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              hold.status === "fulfilled"
                                ? "success"
                                : hold.status === "cancelled"
                                  ? "danger"
                                  : "gold"
                            }
                          >
                            {hold.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          {hold.status === "pending" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openApprove(hold)}
                            >
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* QR Code Scanner Overlay */}
      <QRScanner
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setScannerTarget(null);
        }}
        onScan={handleScanSuccess}
      />

      {/* Show Loan QR Card Modal */}
      <AnimatePresence>
        {qrModalLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalLoan(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-parchment-100 dark:bg-ink-950 p-6 shadow-premium border border-gold-400/30 flex flex-col items-center text-center"
            >
              <button
                onClick={() => setQrModalLoan(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-mist hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
              >
                <X className="size-5" />
              </button>

              <div className="w-12 h-12 bg-gold-400/15 rounded-full flex items-center justify-center mb-4">
                <QrCode className="size-6 text-gold-500" />
              </div>

              <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory">
                Borrowing Transaction Card
              </h3>
              <p className="text-xs text-mist mt-1">
                Scan with any camera to open Check In with this copy pre-filled.
              </p>

              {/* QR Code container with light background to ensure high contrast/readability */}
              <div className="mt-6 p-4 bg-white rounded-xl shadow-inner border border-gold-400/20">
                <QRCode
                  value={`${origin}/circulation?checkin=${encodeURIComponent(qrModalLoan.copy?.barcode ?? "")}`}
                  size={160}
                />
              </div>

              {/* Transaction details card */}
              <div className="mt-6 w-full text-left space-y-2 text-xs bg-gold-400/5 border border-gold-400/10 p-4 rounded-xl">
                <p className="flex justify-between">
                  <span className="text-mist">Book:</span>
                  <strong className="text-ink-800 dark:text-ivory text-right max-w-[180px] truncate">{qrModalLoan.copy?.books?.title}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-mist">Borrower:</span>
                  <strong className="text-ink-800 dark:text-ivory">{qrModalLoan.profile?.full_name}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-mist">Barcode:</span>
                  <strong className="text-ink-800 dark:text-ivory font-mono">{qrModalLoan.copy?.barcode}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-mist">Due Date:</span>
                  <strong className="text-ink-800 dark:text-ivory">
                    {new Date(qrModalLoan.due_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </strong>
                </p>
              </div>

                <div className="mt-6 w-full flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => window.print()}>
                    <Printer className="size-4" />
                    Print Card
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => setQrModalLoan(null)}>
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Hold approval: admin selects a copy + due date */}
      <AnimatePresence>
        {approvingHold && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApprovingHold(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-parchment-100 p-6 shadow-premium dark:bg-ink-950 border border-gold-400/30"
            >
              <button
                onClick={() => setApprovingHold(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-mist transition-colors hover:bg-gold-400/10 hover:text-ink-800 dark:hover:text-ivory"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              <h3 className="font-serif text-lg font-bold text-ink-800 dark:text-ivory">
                Approve Hold
              </h3>
              <p className="mt-1 text-sm text-mist">
                Issue{" "}
                <span className="font-medium text-ink-800 dark:text-ivory">
                  {approvingHold.book?.title}
                </span>{" "}
                to {approvingHold.profile?.full_name}.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-mist">
                    Copy to issue
                  </label>
                  {availableCopies.length === 0 ? (
                    <p className="text-xs text-red-500">
                      No available copies for this book.
                    </p>
                  ) : (
                    <select
                      value={approveCopy}
                      onChange={(e) => setApproveCopy(e.target.value)}
                      className="h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
                    >
                      <option value="">Select a copy…</option>
                      {availableCopies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.barcode}
                          {c.branch_name ? ` · ${c.branch_name}` : ""}
                          {c.shelf_location ? ` · ${c.shelf_location}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-mist">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={approveDue}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setApproveDue(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gold-400/15 bg-ink-950/5 px-3 text-sm text-ink-800 focus:border-gold-400/50 focus:outline-none dark:bg-ink-950/40 dark:text-ink-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setApprovingHold(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!approveCopy || !approveDue}
                  isLoading={approveMutation.isPending}
                  onClick={() => approveMutation.mutate()}
                >
                  Issue &amp; Approve
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Loading skeletons ───────────────────────────────────────────────────────────
function LoansSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gold-400/20">
      <div className="divide-y divide-gold-400/10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="size-14 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldsSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gold-400/20">
      <div className="divide-y divide-gold-400/10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
