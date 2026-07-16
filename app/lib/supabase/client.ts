import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Singleton browser Supabase client. Reads credentials from `window.ENV`,
 * which the root loader injects into the document. Reuses a single instance
 * across renders so realtime subscriptions and auth state persist.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  if (typeof window === "undefined") {
    return createBrowserClient("https://dummy.supabase.co", "dummy-anon-key");
  }

  const env = window.ENV;
  if (!env?.SUPABASE_URL || !env?.SUPABASE_ANON_KEY) {
    throw new Error("Supabase env not available on the client.");
  }

  browserClient = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  return browserClient;
}
