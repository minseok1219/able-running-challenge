import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const BACKUP_ROOT = path.join(PROJECT_ROOT, "backups");
const LOG_DIRECTORY_NAME = "logs";

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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function getVolumeRoot(targetPath) {
  const normalized = path.resolve(targetPath);
  const segments = normalized.split(path.sep).filter(Boolean);

  if (segments[0] !== "Volumes" || !segments[1]) {
    return null;
  }

  return path.join(path.sep, segments[0], segments[1]);
}

async function ensureNasMounted(targetPath) {
  const volumeRoot = getVolumeRoot(targetPath);

  if (!volumeRoot) {
    return true;
  }

  return pathExists(volumeRoot);
}

async function copyEntry(sourcePath, destinationPath) {
  const stat = await fs.stat(sourcePath);

  if (stat.isDirectory()) {
    await fs.cp(sourcePath, destinationPath, {
      recursive: true,
      force: true,
      errorOnExist: false
    });
    return;
  }

  await fs.copyFile(sourcePath, destinationPath);
}

async function main() {
  const env = await readEnvFile(ENV_PATH);
  const nasBackupDirectory = env.NAS_BACKUP_DIR?.trim();

  if (!nasBackupDirectory) {
    console.log("[backup-nas-sync] Skipped: NAS_BACKUP_DIR is not configured in .env.local.");
    return;
  }

  const mounted = await ensureNasMounted(nasBackupDirectory);

  if (!mounted) {
    console.log(`[backup-nas-sync] Skipped: NAS volume is not mounted for ${nasBackupDirectory}.`);
    return;
  }

  const sourceExists = await pathExists(BACKUP_ROOT);

  if (!sourceExists) {
    throw new Error(`Source backup directory not found: ${BACKUP_ROOT}`);
  }

  await fs.mkdir(nasBackupDirectory, { recursive: true });

  const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
  const copiedEntries = [];

  for (const entry of entries) {
    if (entry.name === LOG_DIRECTORY_NAME) {
      continue;
    }

    const sourcePath = path.join(BACKUP_ROOT, entry.name);
    const destinationPath = path.join(nasBackupDirectory, entry.name);

    await copyEntry(sourcePath, destinationPath);
    copiedEntries.push(entry.name);
  }

  const syncManifest = {
    syncedAtUtc: new Date().toISOString(),
    source: BACKUP_ROOT,
    destination: nasBackupDirectory,
    copiedEntries
  };

  await fs.writeFile(
    path.join(nasBackupDirectory, "nas-sync-manifest.json"),
    JSON.stringify(syncManifest, null, 2),
    "utf8"
  );

  console.log(`[backup-nas-sync] Synced ${copiedEntries.length} entries to ${nasBackupDirectory}`);
}

main().catch((error) => {
  console.error("[backup-nas-sync]", error.message);
  process.exit(1);
});
