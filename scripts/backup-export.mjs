import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const BACKUP_ROOT = path.join(PROJECT_ROOT, "backups");
const LOG_ROOT = path.join(BACKUP_ROOT, "logs");
const TABLES = [
  "branches",
  "challenge_types",
  "users",
  "records",
  "admin_actions"
];
const PAGE_SIZE = 1000;

function formatParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function formatTimestamp(date, timeZone = "Asia/Seoul") {
  const parts = formatParts(date, timeZone);
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

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

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

function getOrderColumn(table) {
  if (table === "challenge_types") {
    return "sort_order";
  }

  return "created_at";
}

async function fetchTableRows(supabase, table) {
  const rows = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const orderColumn = getOrderColumn(table);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`${table} export failed: ${error.message}`);
    }

    rows.push(...(data ?? []));

    if (!data || data.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return rows;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function main() {
  const now = new Date();
  const env = await readEnvFile(ENV_PATH);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(".env.local must include NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const backupId = formatTimestamp(now);
  const backupDirectory = path.join(BACKUP_ROOT, backupId);
  const exportedTables = [];

  await ensureDirectory(BACKUP_ROOT);
  await ensureDirectory(LOG_ROOT);
  await ensureDirectory(backupDirectory);

  for (const table of TABLES) {
    const rows = await fetchTableRows(supabase, table);
    const targetPath = path.join(backupDirectory, `${table}.json`);

    await writeJson(targetPath, rows);
    exportedTables.push({
      table,
      rowCount: rows.length,
      file: `${table}.json`
    });
  }

  const kst = formatParts(now, "Asia/Seoul");
  const manifest = {
    backupId,
    generatedAtUtc: now.toISOString(),
    generatedAtKst: `${kst.year}-${kst.month}-${kst.day} ${kst.hour}:${kst.minute}:${kst.second} KST`,
    source: url,
    tables: exportedTables
  };

  await writeJson(path.join(backupDirectory, "manifest.json"), manifest);
  await writeJson(path.join(BACKUP_ROOT, "latest-manifest.json"), manifest);

  console.log(`Backup completed: ${backupDirectory}`);

  for (const exportedTable of exportedTables) {
    console.log(`- ${exportedTable.table}: ${exportedTable.rowCount} rows`);
  }
}

main().catch((error) => {
  console.error("[backup-export]", error.message);
  process.exit(1);
});
