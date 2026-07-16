import { redirect, Outlet } from "react-router";
import type { Route } from "./+types/_auth";
import { getAuthUser } from "~/lib/auth";
import { AuroraBackground } from "~/components/ui/aurora-background";
import { Logo } from "~/components/ui/logo";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getAuthUser(request);
  if (user) throw redirect("/");
  return null;
}

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col lg:flex-row">
      <AuroraBackground />

      {/* Brand showcase */}
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 lg:flex">
        <Logo />
        <div className="max-w-md">
          <p className="font-serif text-4xl leading-snug text-ivory">
            “A library is not a luxury but one of the necessities of life.”
          </p>
          <p className="mt-4 text-sm tracking-wide text-mist">— Henry Ward Beecher</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-mist">
          <span className="h-px w-12 bg-gold-400/40" />
          EST. MMXXVI · QUIET LUXURY FOR THE MODERN READER
        </div>
      </aside>

      {/* Form stage */}
      <main className="relative flex flex-1 items-center justify-center p-6 sm:p-12">
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
