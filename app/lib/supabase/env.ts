/**
 * Public environment shared between server and client.
 * The anon key is safe to expose to the browser; RLS enforces access.
 */
export type PublicEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

/** Server-only secrets. Never expose the service role key to the browser. */
type ServerEnv = PublicEnv & {
  SUPABASE_SERVICE_ROLE_KEY: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill in your Supabase project credentials.`,
    );
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  return {
    SUPABASE_URL: requireEnv("SUPABASE_URL"),
    SUPABASE_ANON_KEY: requireEnv("SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getPublicServerEnv(): PublicEnv {
  const env = getServerEnv();
  return {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
  };
}

declare global {
  interface Window {
    ENV: PublicEnv;
  }
}
