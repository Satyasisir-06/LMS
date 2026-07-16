import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";
import { parseCookies, serializeCookie } from "./cookies";

export type SupabaseServerHandle = {
  client: SupabaseClient;
  /** Accumulated Set-Cookie headers to forward onto the response. */
  headers: Headers;
};

/**
 * Creates a Supabase client bound to the incoming request's cookies.
 * Any auth-driven cookie mutations (sign-in, refresh) are captured in
 * `headers` so the loader/action can forward them to the browser.
 */
export function createSupabaseServerClient(request: Request): SupabaseServerHandle {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getServerEnv();
  const headers = new Headers();
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");

  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookies).map(([name, value]) => ({ name, value }));
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => {
          headers.append(
            "Set-Cookie",
            serializeCookie(name, value, options),
          );
        });
      },
    },
  });

  return { client, headers };
}

/**
 * Service-role client for privileged operations (admin seeding, cron logic).
 * Bypasses RLS — use sparingly and never with user input in raw queries.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
