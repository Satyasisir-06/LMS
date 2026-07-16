import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import {
  getAdminStats,
  getPopularBooks,
  getLoansByBranch,
  getFineSettings,
} from "../app/lib/supabase/analytics.ts";
import {
  getActiveLoans,
  getAllHolds,
} from "../app/lib/supabase/circulation.ts";

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

async function testAll() {
  console.log("Testing getAdminStats...");
  try {
    const stats = await getAdminStats(supabase);
    console.log("Stats:", stats);
  } catch (e) {
    console.error("Stats failed:", e);
  }

  console.log("\nTesting getPopularBooks...");
  try {
    const popular = await getPopularBooks(supabase);
    console.log("Popular:", popular);
  } catch (e) {
    console.error("Popular failed:", e);
  }

  console.log("\nTesting getLoansByBranch...");
  try {
    const loansByBranch = await getLoansByBranch(supabase);
    console.log("Loans by branch:", loansByBranch);
  } catch (e) {
    console.error("Loans by branch failed:", e);
  }

  console.log("\nTesting getFineSettings...");
  try {
    const fineSettings = await getFineSettings(supabase);
    console.log("Fine settings:", fineSettings);
  } catch (e) {
    console.error("Fine settings failed:", e);
  }

  console.log("\nTesting getActiveLoans...");
  try {
    const activeLoans = await getActiveLoans(supabase);
    console.log("Active loans count:", activeLoans.length);
  } catch (e) {
    console.error("Active loans failed:", e);
  }

  console.log("\nTesting getAllHolds...");
  try {
    const allHolds = await getAllHolds(supabase);
    console.log("All holds count:", allHolds.length);
  } catch (e) {
    console.error("All holds failed:", e);
  }
}

testAll();
