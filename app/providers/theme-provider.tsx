import { useEffect } from "react";
import { useUIStore, getInitialTheme } from "~/stores/ui-store";

/**
 * Syncs the Zustand theme state with the <html> class set by the
 * no-FOUC inline script in root.tsx. Runs once after hydration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    setTheme(getInitialTheme());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
