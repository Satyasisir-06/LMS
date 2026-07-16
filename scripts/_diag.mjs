import { createClient } from "@supabase/supabase-js";

// Reads credentials from the environment (or a local .env) rather than
// hardcoding secrets. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before
// running, e.g. via a .env file or exported shell variables.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

function log(name, err, data) {
  if (err) console.log(`FAIL ${name}:`, err.message);
  else console.log(`OK   ${name}:`, Array.isArray(data) ? `${data.length} rows` : JSON.stringify(data));
}

async function main() {
  // circulation: getActiveLoans
  {
    const { data, error } = await sb.from("borrowings").select(`*, profiles (full_name, student_id), book_copies (barcode, shelf_location, books (title, cover_url))`).in("status", ["active", "overdue"]).order("due_date", { ascending: true });
    log("getActiveLoans", error, data);
  }
  // circulation: getAllHolds
  {
    const { data, error } = await sb.from("holds").select(`*, profiles (full_name, student_id), books (title, cover_url)`).order("created_at", { ascending: true });
    log("getAllHolds", error, data);
  }
  // admin: getPopularBooks
  {
    const { data, error } = await sb.from("borrowings").select(`book_copies (books (id, title, cover_url))`);
    log("getPopularBooks", error, data);
  }
  // admin: getLoansByBranch
  {
    const { data, error } = await sb.from("borrowings").select(`status, book_copies (branches (id, name))`).in("status", ["active", "overdue"]);
    log("getLoansByBranch", error, data);
  }
  // admin: getAdminStats counts
  {
    const { count, error } = await sb.from("book_copies").select("*", { count: "exact", head: true }).eq("status", "available");
    log("availableCopies", error, count);
  }
  // admin: getFineSettings RPC
  {
    const { data, error } = await sb.rpc("get_fine_settings");
    log("get_fine_settings", error, data);
  }
  // check table existence
  for (const t of ["profiles","books","book_copies","borrowings","holds","branches","fine_settings"]) {
    const { error } = await sb.from(t).select("*", { count: "exact", head: true });
    log("table:"+t, error, null);
  }
}

main().catch((e) => console.error("SCRIPT ERROR", e));
