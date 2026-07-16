import { create } from "zustand";

export type Theme = "dark" | "light";

type UIState = {
  sidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "athenaeum-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  theme: "dark",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    applyTheme(next);
  },
}));

/** Read the persisted theme without subscribing to the store. */
export function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
