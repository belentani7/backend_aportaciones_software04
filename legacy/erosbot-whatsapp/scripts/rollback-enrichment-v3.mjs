import { copyFile, access } from "node:fs/promises";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");
const active = join(dataDir, "enriched-patterns-v3.active.json");
const current = join(dataDir, "enriched-patterns-v3.json");
const backup = join(dataDir, "enriched-patterns-v3.rollback.json");
const mode = process.argv[2] ?? "activate";

if (mode === "activate") {
  await access(current);
  try { await access(active); await copyFile(active, backup); }
  catch { await copyFile(current, backup); }
  await copyFile(current, active);
  console.log(JSON.stringify({ mode, active: "data/enriched-patterns-v3.active.json", backup: "data/enriched-patterns-v3.rollback.json" }));
} else if (mode === "rollback") {
  await access(backup);
  await copyFile(backup, active);
  console.log(JSON.stringify({ mode, active: "data/enriched-patterns-v3.active.json" }));
} else {
  throw new Error("Use activate or rollback");
}
