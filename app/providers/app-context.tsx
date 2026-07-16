import { createContext, useContext, useEffect } from "react";
import type { AuthUser } from "~/lib/supabase/types";
import { useAuthStore } from "~/stores/auth-store";

const AppContext = createContext<AuthUser | null>(null);

/**
 * Provides the authenticated user to the dashboard subtree (SSR-safe via
 * context) and mirrors it into the Zustand auth store for any client-only
 * consumers that prefer the global store.
 */
export function AppProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(user);
  }, [user, hydrate]);

  return <AppContext.Provider value={user}>{children}</AppContext.Provider>;
}

export function useUser(): AuthUser {
  const user = useContext(AppContext);
  if (!user) {
    throw new Error("useUser must be used within an authenticated route.");
  }
  return user;
}
