import { useState, useCallback, Fragment } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Loader2,
  ChevronDown,
  ChevronUp,
  Shield,
  GraduationCap,
  BookOpen,
  Crown,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { GlassCard } from "~/components/ui/glass-card";
import { ConfirmDialog } from "~/components/ui/dialog";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import { useToastStore } from "~/stores/toast-store";
import { useUser } from "~/providers/app-context";
import { ROLE_LABELS, type UserRole } from "~/lib/supabase/types";
import { cn } from "~/lib/utils";

const supabase = getSupabaseBrowserClient();

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="size-3.5" />,
  faculty: <BookOpen className="size-3.5" />,
  librarian: <Shield className="size-3.5" />,
  admin: <Crown className="size-3.5" />,
};

const roleColors: Record<UserRole, "gold" | "success" | "info" | "danger" | "neutral"> = {
  student: "neutral",
  faculty: "info",
  librarian: "success",
  admin: "gold",
};

const allRoles: UserRole[] = ["student", "faculty", "librarian", "admin"];

export function MembersCard() {
  const queryClient = useQueryClient();
  const currentUser = useUser();
  const { push: toast } = useToastStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    memberId: string | null;
    newRole: UserRole | null;
  }>({ open: false, memberId: null, newRole: null });

  const { data: members = [] } = useQueryClient().getQueryData(["adminMembers"]) as {
    data?: Array<{
      id: string;
      full_name: string | null;
      role: UserRole;
      student_id: string | null;
      department: string | null;
      created_at: string;
    }>;
  } ?? { data: [] };

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { error } = await supabase.rpc("set_user_role", { target: id, new_role: role });
      if (error) throw error;
    },
    onSuccess: (_, { id, role }) => {
      queryClient.setQueryData(["adminMembers"], (old: any) =>
        old?.map((m: any) => (m.id === id ? { ...m, role } : m))
      );
      toast(`Role updated to ${ROLE_LABELS[role]}`, "success");
    },
    onError: (err: Error) => {
      toast(err.message || "Failed to update role", "error");
    },
  });

  const handleRoleClick = useCallback((memberId: string, newRole: UserRole) => {
    if (memberId === currentUser?.id) {
      toast("You cannot change your own role", "error");
      return;
    }
    setDialog({ open: true, memberId, newRole });
  }, [currentUser?.id, toast]);

  const confirmRoleChange = useCallback(async () => {
    if (!dialog.memberId || !dialog.newRole) return;
    await roleMutation.mutateAsync({ id: dialog.memberId, role: dialog.newRole });
    setDialog({ open: false, memberId: null, newRole: null });
  }, [dialog.memberId, dialog.newRole, roleMutation]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <GlassCard className="mt-6 p-6 border border-gold-400/20">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-gold-500" />
        <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-800 dark:text-ivory">
          Members & Roles
        </h3>
        <span className="ml-auto text-sm text-mist">{members.length} members</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gold-400/20">
        <table className="w-full border-collapse text-left text-sm text-ink-800 dark:text-ivory">
          <thead className="bg-gold-400/5 text-xs font-bold text-mist uppercase tracking-wider border-b border-gold-400/15">
            <tr>
              <th className="p-3">Member</th>
              <th className="p-3 hidden md:table-cell">Role</th>
              <th className="p-3 hidden lg:table-cell">Details</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-mist">
                  No members found
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const isCurrentUser = member.id === currentUser?.id;
                const isExpanded = expandedId === member.id;

                return (
                  <Fragment key={member.id}>
                    <tr className="border-b border-gold-400/10 hover:bg-gold-400/5 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-600 dark:text-gold-400 font-medium">
                            {member.full_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{member.full_name ?? "Unnamed"}</p>
                            {member.student_id && (
                              <p className="text-xs text-mist">ID: {member.student_id}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="p-3 hidden lg:table-cell text-mist">
                        {member.department ?? "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <RoleSelector
                            member={member}
                            currentUserId={currentUser?.id}
                            onRoleClick={handleRoleClick}
                            disabled={isCurrentUser || roleMutation.isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(member.id)}
                            className="text-mist hover:text-gold-500"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={4} className="p-0">
                            <div className="bg-ink-500/5 border-t border-gold-400/10 px-6 py-4">
                              <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <dt className="text-mist">Joined</dt>
                                  <dd className="font-medium">
                                    {new Date(member.created_at).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-mist">Role since</dt>
                                  <dd className="font-medium">{ROLE_LABELS[member.role]}</dd>
                                </div>
                                {member.student_id && (
                                  <div>
                                    <dt className="text-mist">Student ID</dt>
                                    <dd className="font-medium font-mono">{member.student_id}</dd>
                                  </div>
                                )}
                                {member.department && (
                                  <div>
                                    <dt className="text-mist">Department</dt>
                                    <dd className="font-medium">{member.department}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title="Change member role?"
        description={
          dialog.memberId && dialog.newRole && members.find((m) => m.id === dialog.memberId)
            ? `Change ${members.find((m) => m.id === dialog.memberId)?.full_name || "member"} to ${ROLE_LABELS[dialog.newRole]}`
            : ""
        }
        confirmText="Change role"
        variant="primary"
        isLoading={roleMutation.isPending}
        onConfirm={confirmRoleChange}
      />
    </GlassCard>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={roleColors[role]} className="gap-1.5">
      {roleIcons[role]}
      {ROLE_LABELS[role]}
    </Badge>
  );
}

function RoleSelector({
  member,
  currentUserId,
  onRoleClick,
  disabled,
}: {
  member: { id: string; role: UserRole };
  currentUserId?: string;
  onRoleClick: (id: string, role: UserRole) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isCurrentUser = member.id === currentUserId;

  if (isCurrentUser) {
    return (
      <Badge variant="neutral" className="gap-1.5">
        <UserCheck className="size-3.5" />
        You
      </Badge>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 min-w-[120px] justify-between"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-1.5">
          {roleIcons[member.role]}
          <span>{ROLE_LABELS[member.role]}</span>
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </Button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 z-20 mt-1.5 w-44 origin-top-right glass-strong border border-gold-400/30 rounded-xl py-1.5 shadow-lg"
          role="listbox"
        >
          {allRoles
            .filter((r) => r !== member.role)
            .map((role) => (
              <button
                key={role}
                role="option"
                onClick={() => onRoleClick(member.id, role)}
                disabled={disabled}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                  "hover:bg-gold-400/10 focus:outline-none focus:bg-gold-400/10",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {roleIcons[role]}
                <span>{ROLE_LABELS[role]}</span>
              </button>
            ))}
        </motion.div>
      )}
    </div>
  );
}