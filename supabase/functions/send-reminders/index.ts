// Athenaeum — send-reminders edge function.
//
// Dispatches external reminders (email / sms / whatsapp) for rows in the
// `reminders` table whose `channel` is external. In-app reminders are created
// directly by the `generate_due_reminders()` SQL job (run via pg_cron) and do
// not need dispatch here.
//
// External delivery is gated on environment configuration so the function is a
// safe no-op when no provider is set:
//   • Email  → RESEND_API_KEY + FROM_EMAIL (https://resend.com)
//   • SMS    → TWILIO_*,  WhatsApp → TWILIO_* with a WhatsApp-enabled sender
//
// Deploy: supabase functions deploy send-reminders
// Schedule (optional, in supabase/config.toml or via the dashboard):
//   cron 0 7 * * *  -> POST /functions/v1/send-reminders

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface Reminder {
  id: string;
  user_id: string;
  channel: "in_app" | "email" | "sms" | "whatsapp";
  kind: "pre_due" | "due" | "overdue_daily";
  message: string;
  profiles: { full_name: string; email: string | null; phone: string | null } | null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!serviceRole || !url) {
    return json({ ok: false, error: "missing service role env" }, 500);
  }

  // Fetch external reminders created in the last 24h that have not been sent.
  const res = await fetch(
    `${url}/rest/v1/reminders?channel=in.(email,sms,whatsapp)&sent_at=gte.` +
      new Date(Date.now() - 86400000).toISOString() +
      "&select=id,user_id,channel,kind,message,profiles(full_name,email,phone)",
    {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!res.ok) return json({ ok: false, error: "db query failed" }, 500);

  const rows: Reminder[] = await res.json();
  const emailKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "library@athenaeum.app";
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_FROM");

  let dispatched = 0;
  for (const r of rows) {
    if (r.channel === "email" && emailKey && r.profiles?.email) {
      const ok = await sendEmail(emailKey, fromEmail, r.profiles.email, r.message);
      if (ok) dispatched++;
    } else if (
      (r.channel === "sms" || r.channel === "whatsapp") &&
      twilioSid && twilioToken && twilioFrom && r.profiles?.phone
    ) {
      const ok = await sendTwilio(r.channel, twilioSid, twilioToken, twilioFrom, r.profiles.phone, r.message);
      if (ok) dispatched++;
    }
  }

  return json({ ok: true, scanned: rows.length, dispatched });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function sendEmail(apiKey: string, from: string, to: string, message: string): Promise<boolean> {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: "Library reminder", text: message }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function sendTwilio(
  channel: "sms" | "whatsapp",
  sid: string,
  token: string,
  from: string,
  to: string,
  message: string,
): Promise<boolean> {
  try {
    const sender = channel === "whatsapp" ? `whatsapp:${from}` : from;
    const recipient = channel === "whatsapp" ? `whatsapp:${to}` : to;
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: sender, To: recipient, Body: message }).toString(),
      },
    );
    return r.ok;
  } catch {
    return false;
  }
}
