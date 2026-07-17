import { Outlet, useLocation, useLoaderData, data } from "react-router";
import { motion } from "framer-motion";

import type { Route } from "./+types/_dashboard";
import { requireAuth } from "~/lib/auth";
import { Sidebar } from "~/components/layout/sidebar";
import { Topbar } from "~/components/layout/topbar";
import { MobileNav } from "~/components/layout/mobile-nav";
import { AppProvider } from "~/providers/app-context";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, headers } = await requireAuth(request);
  return data({ user }, { headers });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

const LUX_EASE = [0.22, 1, 0.36, 1] as const;

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <AppProvider user={user}>
      <div className="min-h-dvh">
        <Sidebar user={user} />
        <div className="lg:pl-72">
          <Topbar user={user} />
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: LUX_EASE }}
            className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-16"
          >
            <Outlet />
          </motion.main>
        </div>
        <MobileNav user={user} />
      </div>
    </AppProvider>
  );
}
