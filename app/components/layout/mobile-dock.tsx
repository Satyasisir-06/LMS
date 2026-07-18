import { useLocation, useNavigate } from "react-router";
import { MoreHorizontal } from "lucide-react";
import { Dock, type DockItem } from "~/components/ui/dock";
import { visibleNav } from "~/lib/navigation";
import { useUIStore } from "~/stores/ui-store";
import { cn } from "~/lib/utils";
import type { AuthUser } from "~/lib/supabase/types";

const VISIBLE_MAX = 6;

/**
 * Mobile navigation implemented as a magnifying macOS-style dock. Shown only
 * below the lg breakpoint; the static sidebar rail takes over on larger
 * screens. Extra role-gated routes collapse into a "More" item that opens the
 * full sidebar drawer.
 */
export function MobileDock({ user }: { user: AuthUser }) {
  const items = visibleNav(user.profile?.role ?? null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSidebar } = useUIStore();

  const isActive = (to: string) =>
    to === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(to);

  const primary = items.slice(0, VISIBLE_MAX);
  const hasMore = items.length > VISIBLE_MAX;

  const dockItems: DockItem[] = primary.map((item) => ({
    icon: <item.icon className="size-6" />,
    label: item.label,
    className: cn(
      isActive(item.to)
        ? "bg-gold-400/15 text-gold-600 ring-gold-400/40 dark:text-gold-300"
        : "text-ink-500 dark:text-ink-300",
    ),
    onClick: () => navigate(item.to),
  }));

  if (hasMore) {
    dockItems.push({
      icon: <MoreHorizontal className="size-6" />,
      label: "More",
      className: "text-ink-500 dark:text-ink-300",
      onClick: () => setSidebar(true),
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <Dock items={dockItems} className="mb-3" />
    </div>
  );
}
