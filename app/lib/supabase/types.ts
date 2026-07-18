/**
 * Application-level user roles (RBAC).
 * Mirrors the `user_role` enum created in supabase/schema.sql.
 */
export type UserRole = "student" | "faculty" | "librarian" | "admin";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 1,
  faculty: 2,
  librarian: 3,
  admin: 4,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  librarian: "Librarian",
  admin: "Administrator",
};

export function hasRole(current: UserRole | null, required: UserRole): boolean {
  if (!current) return false;
  return ROLE_HIERARCHY[current] >= ROLE_HIERARCHY[required];
}

/** Profile row joined to auth.users via the handle_new_user trigger. */
export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  department: string | null;
  phone: string | null;
  student_id: string | null;
  academic_year: number | null;
  semester: string | null;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  profile: Profile | null;
};
