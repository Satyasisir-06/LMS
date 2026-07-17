import {
  AlarmClock,
  BookOpen,
  BookMarked,
  Heart,
  LayoutDashboard,
  Library,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "./supabase/types";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
  /** When set, the item is only rendered for these roles. */
  roles?: UserRole[];
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & activity",
  },
  {
    label: "Catalog",
    to: "/catalog",
    icon: BookOpen,
    description: "Browse the collection",
  },
  {
    label: "Wishlist",
    to: "/wishlist",
    icon: Heart,
    description: "Saved titles",
  },
  {
    label: "Circulation",
    to: "/circulation",
    icon: Library,
    description: "Borrow, return & holds",
    roles: ["librarian", "admin"],
  },
  {
    label: "Overdue",
    to: "/overdue",
    icon: AlarmClock,
    description: "Overdue books & fines",
    roles: ["librarian", "admin"],
  },
  {
    label: "Manage Catalog",
    to: "/manage",
    icon: BookMarked,
    description: "Books, authors & branches",
    roles: ["librarian", "admin"],
  },
  {
    label: "Administration",
    to: "/admin",
    icon: ShieldCheck,
    description: "Users & system settings",
    roles: ["admin"],
  },
  {
    label: "Profile",
    to: "/profile",
    icon: User,
    description: "Your account & history",
  },
];

export function visibleNav(role: UserRole | null): NavItem[] {
  return navItems.filter((item) => !item.roles || (role && item.roles.includes(role)));
}
