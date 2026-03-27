import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const DEFAULT_RETENTION_DAYS = 30;

async function readEnvFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function resolveRetentionDays() {
  const raw = Number(process.argv[2] ?? DEFAULT_RETENTION_DAYS);

  if (!Number.isFinite(raw) || raw < 1) {
    throw new Error("Retention days must be a positive number.");
  }

  return Math.floor(raw);
}

async function main() {
  const env = await readEnvFile(ENV_PATH);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(".env.local must include NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const retentionDays = resolveRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase
    .from("login_attempts")
    .delete()
    .lt("updated_at", cutoff)
    .select("key");

  if (error) {
    throw new Error(`login_attempts cleanup failed: ${error.message}`);
  }

  console.log(
    `Deleted ${data?.length ?? 0} login_attempt rows older than ${retentionDays} days (cutoff: ${cutoff}).`
  );
}

main().catch((error) => {
  console.error("[cleanup-login-attempts]", error.message);
  process.exit(1);
});
