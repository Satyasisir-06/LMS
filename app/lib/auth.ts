import { redirect } from "react-router";
import { createSupabaseServerClient } from "./supabase/server";
import { hasRole, type AuthUser, type Profile, type UserRole } from "./supabase/types";

/**
 * Resolves the authenticated user + profile for an incoming request.
 * Returns the accumulated Set-Cookie headers so callers can forward
 * any token-refresh mutations onto their response.
 */
export async function getAuthUser(
  request: Request,
): Promise<{ user: AuthUser | null; headers: Headers }> {
  const { client, headers } = createSupabaseServerClient(request);

  let user: Awaited<ReturnType<typeof client.auth.getUser>>["data"]["user"];
  try {
    ({ data: { user } } = await client.auth.getUser());
  } catch {
    // Network / config failure — treat as unauthenticated rather than crashing.
    return { user: null, headers };
  }

  if (!user) return { user: null, headers };

  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      profile: (profile as Profile | null) ?? null,
    },
    headers,
  };
}

/** Requires authentication; redirects to /login otherwise. */
export async function requireAuth(request: Request): Promise<{
  user: AuthUser;
  headers: Headers;
}> {
  const { user, headers } = await getAuthUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return { user, headers };
}

/** Requires a minimum role (hierarchical); redirects to / if insufficient. */
export async function requireRole(
  request: Request,
  required: UserRole,
): Promise<{ user: AuthUser; headers: Headers }> {
  const { user, headers } = await requireAuth(request);
  if (!hasRole(user.profile?.role ?? null, required)) {
    throw redirect("/");
  }
  return { user, headers };
}
