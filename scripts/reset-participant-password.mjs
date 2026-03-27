import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");

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

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const env = await readEnvFile(ENV_PATH);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const username = String(process.argv[2] ?? "").trim().toLowerCase();
  const nextPassword = String(process.argv[3] ?? "");

  if (!url || !serviceRoleKey) {
    throw new Error(".env.local must include NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!username || !nextPassword) {
    throw new Error("Usage: npm run reset:participant-password -- <username> <new-password>");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, username, name, participant_code, role, session_version")
    .eq("username", username)
    .eq("role", "participant")
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Participant lookup failed: ${fetchError.message}`);
  }

  if (!user) {
    throw new Error(`Participant not found for username: ${username}`);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash: hashPassword(nextPassword),
      session_version: (user.session_version ?? 0) + 1
    })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(`Password reset failed: ${updateError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        updated: true,
        username: user.username,
        name: user.name,
        participantCode: user.participant_code,
        newSessionVersion: (user.session_version ?? 0) + 1
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[reset-participant-password]", error.message);
  process.exit(1);
});
