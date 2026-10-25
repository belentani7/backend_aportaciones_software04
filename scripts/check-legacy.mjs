#!/usr/bin/env node
/**
 * Verify that this PRIVATE legacy portfolio still contains the complete set
 * of flattened source folders claimed in README.md. This does not prove that
 * Git history, remote backups, credentials, or services have been preserved.
 */
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_URL = /^https:\/\/github\.com\/belentani7\/([^/)#\s]+)\/?$/i;
const ROW = /^\|\s*`legacy\/([^\`]+)`\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|/gm;

export function inspect(root) {
  const diagnostics = [];
  const directory = resolve(root);
  const readmePath = join(directory, "README.md");
  const legacyPath = join(directory, "legacy");
  if (!existsSync(readmePath) || !lstatSync(readmePath).isFile()) {
    return { ok: false, expected: 0, present: 0, missing: [], untracked: [], diagnostics: ["README.md is missing"] };
  }

  const markdown = readFileSync(readmePath, "utf8");
  const manifest = new Map();
  for (const [, folder, label, url] of markdown.matchAll(ROW)) {
    const clean = folder.trim();
    if (!clean || clean === "." || clean === ".." || clean.includes("/") || clean.includes("\\") || clean.includes("\0")) {
      diagnostics.push(`Unsafe legacy entry: ${folder}`);
      continue;
    }
    if (manifest.has(clean)) {
      diagnostics.push(`Duplicate legacy entry: ${clean}`);
      continue;
    }
    const m = url.match(REPO_URL);
    if (!m || m[1].toLowerCase() !== clean.toLowerCase() || label.trim().replace(/^`|`$/g, "").toLowerCase() !== clean.toLowerCase()) {
      diagnostics.push(`Source URL / label does not match ${clean}`);
    }
    manifest.set(clean, url);
  }
  if (manifest.size === 0) diagnostics.push("No legacy source rows found in README.md");
  if (!existsSync(legacyPath) || !lstatSync(legacyPath).isDirectory() || lstatSync(legacyPath).isSymbolicLink()) {
    return { ok: false, expected: manifest.size, present: 0, missing: [...manifest.keys()], untracked: [], diagnostics: [...diagnostics, "legacy/ is missing or not a real directory"] };
  }

  const actual = new Set();
  for (const entry of readdirSync(legacyPath, { withFileTypes: true })) {
    const full = join(legacyPath, entry.name);
    if (entry.isSymbolicLink() || !entry.isDirectory() || !full.startsWith(legacyPath + sep)) {
      diagnostics.push(`Unexpected file or link in legacy/: ${entry.name}`);
    }
    actual.add(entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      // A folder name alone is not evidence that any legacy source survived.
      // Walk without following symlinks: nested links could expose files outside
      // the flattened source when this tree is copied or packaged.
      const pending = [{ path: full, relative: entry.name }];
      let files = 0;
      while (pending.length) {
        const current = pending.pop();
        let children;
        try {
          children = readdirSync(current.path, { withFileTypes: true });
        } catch {
          diagnostics.push(`Unreadable legacy directory: ${current.relative}`);
          continue;
        }
        for (const child of children) {
          const childPath = join(current.path, child.name);
          const relative = `${current.relative}/${child.name}`;
          if (child.isSymbolicLink()) diagnostics.push(`Nested symbolic link in legacy/: ${relative}`);
          else if (child.isDirectory()) pending.push({ path: childPath, relative });
          else if (child.isFile()) files++;
          else diagnostics.push(`Unexpected special file in legacy/: ${relative}`);
        }
      }
      if (files === 0) diagnostics.push(`Empty legacy source: ${entry.name}`);
    }
  }
  const missing = [...manifest.keys()].filter((name) => !actual.has(name));
  const untracked = [...actual].filter((name) => !manifest.has(name));
  if (missing.length) diagnostics.push(`Missing legacy sources: ${missing.join(", ")}`);
  if (untracked.length) diagnostics.push(`Unlisted items in legacy/: ${untracked.join(", ")}`);
  return { ok: diagnostics.length === 0, expected: manifest.size, present: manifest.size - missing.length, missing, untracked, diagnostics };
}

function main(argv) {
  const flags = new Set(argv);
  const unknown = [...flags].filter((f) => !["--json", "--help"].includes(f));
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(", ")}`);
    return 2;
  }
  if (flags.has("--help")) {
    console.log("Usage: node scripts/check-legacy.mjs [--json]");
    return 0;
  }
  const repository = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const result = inspect(repository);
  if (flags.has("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Legacy integrity: ${result.present}/${result.expected} recorded source folders found.`);
    if (result.diagnostics.length) for (const issue of result.diagnostics) console.error(`ERROR: ${issue}`);
    else console.log("Folder count, names, and manifest provenance match. Content/historical backup integrity NOT verified.");
  }
  return result.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
