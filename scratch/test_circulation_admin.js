import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read and parse .env manually
const dotenvContent = fs.readFileSync(".env", "utf8");
dotenvContent.split("\n").forEach(line => {
  const [key, ...value] = line.split("=");
  if (key && value.length > 0) {
    process.env[key.trim()] = value.join("=").trim();
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Copied from app/lib/supabase/circulation.ts
async function getActiveLoans(client) {
  const { data, error } = await client
    .from("borrowings")
    .select(`
      *,
      profiles (
        full_name,
        student_id
      ),
      book_copies (
        barcode,
        shelf_location,
        books (
          title,
          cover_url
        )
      )
    `)
    .in("status", ["active", "overdue"])
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data;
}

async function getAllHolds(client) {
  const { data, error } = await client
    .from("holds")
    .select(`
      *,
      profiles (
        full_name,
        student_id
      ),
      books (
        title,
        cover_url
      )
    `)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

// Copied from app/lib/supabase/analytics.ts
async function getAdminStats(client) {
  const [
    members,
    activeLoans,
    overdueLoans,
    fines,
    totalBooks,
    totalCopies,
    availableCopies,
  ] = await Promise.all([
    client.from("profiles").select("*", { count: "exact", head: true }),
    client.from("borrowings").select("*", { count: "exact", head: true }).in("status", ["active", "overdue"]),
    client.from("borrowings").select("*", { count: "exact", head: true }).eq("status", "overdue"),
    client.from("borrowings").select("fine_amount").in("status", ["active", "overdue"]),
    client.from("books").select("*", { count: "exact", head: true }),
    client.from("book_copies").select("*", { count: "exact", head: true }),
    client.from("book_copies").select("*", { count: "exact", head: true }).eq("status", "available"),
  ]);

  const outstandingFines = (fines.data ?? []).reduce(
    (sum, row) => sum + (Number(row.fine_amount) || 0),
    0,
  );

  return {
    members: members.count ?? 0,
    activeLoans: activeLoans.count ?? 0,
    overdueLoans: overdueLoans.count ?? 0,
    outstandingFines,
    totalBooks: totalBooks.count ?? 0,
    totalCopies: totalCopies.count ?? 0,
    availableCopies: availableCopies.count ?? 0,
  };
}

async function getPopularBooks(client, limit = 5) {
  const { data, error } = await client
    .from("borrowings")
    .select(`
      book_copies (
        books (id, title, cover_url)
      )
    `);

  if (error) throw error;
  return data;
}

async function getLoansByBranch(client) {
  const { data, error } = await client
    .from("borrowings")
    .select(`
      status,
      book_copies (
        branches (id, name)
      )
    `)
    .in("status", ["active", "overdue"]);

  if (error) throw error;
  return data;
}

async function getFineSettings(client) {
  const { data, error } = await client.rpc("get_fine_settings");
  if (error) throw error;
  return data;
}

async function runTests() {
  console.log("--- Testing Circulation Queries ---");
  try {
    const loans = await getActiveLoans(supabase);
    console.log("getActiveLoans succeeded. Count:", loans.length);
  } catch (err) {
    console.error("getActiveLoans failed:", err);
  }

  try {
    const holds = await getAllHolds(supabase);
    console.log("getAllHolds succeeded. Count:", holds.length);
  } catch (err) {
    console.error("getAllHolds failed:", err);
  }

  console.log("\n--- Testing Admin/Analytics Queries ---");
  try {
    const stats = await getAdminStats(supabase);
    console.log("getAdminStats succeeded:", stats);
  } catch (err) {
    console.error("getAdminStats failed:", err);
  }

  try {
    const popular = await getPopularBooks(supabase);
    console.log("getPopularBooks succeeded. Count:", popular.length);
  } catch (err) {
    console.error("getPopularBooks failed:", err);
  }

  try {
    const loansByBranch = await getLoansByBranch(supabase);
    console.log("getLoansByBranch succeeded. Count:", loansByBranch.length);
  } catch (err) {
    console.error("getLoansByBranch failed:", err);
  }

  try {
    const settings = await getFineSettings(supabase);
    console.log("getFineSettings succeeded:", settings);
  } catch (err) {
    console.error("getFineSettings failed:", err);
  }
}

runTests();
