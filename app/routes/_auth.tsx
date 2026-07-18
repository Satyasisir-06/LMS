import { redirect, Outlet } from "react-router";
import type { Route } from "./+types/_auth";
import { getAuthUser } from "~/lib/auth";
import { Logo } from "~/components/ui/logo";
import Hyperspeed from "~/components/ui/Hyperspeed/Hyperspeed";
import { hyperspeedPresets } from "~/components/ui/Hyperspeed/HyperSpeedPresets";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getAuthUser(request);
  if (user) throw redirect("/");
  return null;
}

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden lg:flex-row">
      {/* Full-page animated background */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed effectOptions={hyperspeedPresets.six} />
      </div>

      {/* Readability scrim on the form side */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-ink-950/40 via-transparent to-transparent lg:bg-none" aria-hidden />

      {/* Brand showcase (laptops) */}
      <aside className="relative z-10 hidden flex-1 flex-col justify-between p-10 lg:flex xl:p-14">
        <Logo />

        <div className="max-w-md">
          <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400/80">
            The Athenaeum Collection
          </span>
          <p className="font-serif text-4xl leading-snug text-ivory">
            “A library is not a luxury but one of the necessities of life.”
          </p>
          <p className="mt-4 text-sm tracking-wide text-mist">
            — Henry Ward Beecher
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-mist">
          <span className="h-px w-12 bg-gold-400/40" />
          EST. MMXXVI · QUIET LUXURY FOR THE MODERN READER
        </div>
      </aside>

      {/* Form stage */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
