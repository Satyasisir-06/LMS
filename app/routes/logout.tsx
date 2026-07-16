import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { createSupabaseServerClient } from "~/lib/supabase/server";

export async function action({ request }: Route.ActionArgs) {
  const { client, headers } = createSupabaseServerClient(request);
  await client.auth.signOut();
  throw redirect("/login", { headers });
}
