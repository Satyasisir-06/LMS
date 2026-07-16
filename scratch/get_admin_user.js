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

async function getAdminUser() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
  } else {
    for (const user of data.users) {
      console.log(`Email: ${user.email} | ID: ${user.id} | Metadata:`, user.user_metadata);
    }
  }
}

getAdminUser();
