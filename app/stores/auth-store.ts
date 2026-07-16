import { create } from "zustand";
import type { AuthUser } from "~/lib/supabase/types";

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  hydrate: (user: AuthUser | null) => void;
};

/**
 * Client-side cache of the authenticated session. Hydrated from the
 * dashboard loader and kept in sync by the auth provider on sign-out.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  hydrate: (user) => set({ user, hydrated: true }),
}));
