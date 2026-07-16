import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

async function inspectProfiles() {
  const { data, error } = await supabase.from("profiles").select("id, full_name, role");
  if (error) {
    console.error(error);
  } else {
    for (const p of data) {
      console.log(`ID: ${p.id} | Name: ${p.full_name} | Role: ${p.role}`);
    }
  }
}

inspectProfiles();
