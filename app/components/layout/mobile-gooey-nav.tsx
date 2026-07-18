import { useLocation, useNavigate } from "react-router";
import { MoreHorizontal } from "lucide-react";
import { visibleNav } from "~/lib/navigation";
import { useUIStore } from "~/stores/ui-store";
import GooeyNav from "~/components/ui/gooey-nav";
import type { AuthUser } from "~/lib/supabase/types";

/** How many primary destinations fit comfortably in the bottom bar. */
const MAX_PRIMARY = 5;

/**
 * Mobile navigation built on the GooeyNav effect. Shown only below the `lg`
 * breakpoint; the static sidebar rail takes over on larger screens. Role-gated
 * routes that don't fit collapse into a "More" item that opens the sidebar
 * drawer.
 */
export function MobileGooeyNav({ user }: { user: AuthUser }) {
  const items = visibleNav(user.profile?.role ?? null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSidebar } = useUIStore();

  const isActive = (to: string) =>
    to === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(to);

  const activeItem = items.find((i) => isActive(i.to));
  const activeHref = activeItem?.to;

  const primary = items.slice(0, MAX_PRIMARY);
  const hasMore = items.length > MAX_PRIMARY;

  const gooeyItems = primary.map((item) => ({
    label: item.label,
    href: item.to,
    icon: <item.icon className="size-[22px]" />,
  }));
  if (hasMore) {
    gooeyItems.push({
      label: "More",
      href: "#more",
      icon: <MoreHorizontal className="size-[22px]" />,
    });
  }

  const initialActiveIndex = Math.max(
    0,
    primary.findIndex((i) => i.to === activeHref),
  );

  const handleNavigate = (href: string) => {
    if (href === "#more") {
      setSidebar(true);
      return;
    }
    navigate(href);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <div className="gooey-panel w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-950/85 px-3 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <GooeyNav
          items={gooeyItems}
          activeHref={activeHref}
          initialActiveIndex={initialActiveIndex}
          onNavigate={handleNavigate}
          particleCount={12}
          animationTime={500}
        />
      </div>
    </div>
  );
}

export default MobileGooeyNav;
