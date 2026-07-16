// Athenaeum — Supabase Edge Function: apply-overdue-fines
//
// Runs daily (via Supabase Cron or an external scheduler) to mark overdue
// borrowings and accrue fines at the configured daily rate. Deploy with:
//
//   supabase functions deploy apply-overdue-fines --no-verify-jwt
//
// Schedule with cron (e.g. daily at 02:00):
//
//   select cron.schedule(
//     'apply-overdue-fines',
//     '0 2 * * *',
//     $$ select net.http_post(
//          url:='https://<project-ref>.functions.supabase.co/apply-overdue-fines',
//          headers:='{"Authorization": "Bearer <service-role>"}'::jsonb
//        ); $$
//   );
//
// The function uses the service-role key so it bypasses RLS and calls the
// SECURITY DEFINER `apply_overdue_fines()` RPC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("apply_overdue_fines");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ updated: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
