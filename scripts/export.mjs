#!/usr/bin/env node
/**
 * Export del proyecto: manifiesto de fuentes legacy registradas en README.md
 * junto al estado de integridad verificado por scripts/check-legacy.mjs.
 *
 * Esto exporta el CATALOGO (metadatos), no el contenido privado de legacy/.
 * Uso: node scripts/export.mjs [--out export.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspect } from "./check-legacy.mjs";

const REPOSITORY = "belentani7/backend_aportaciones_software04";
// Misma forma de fila que valida check-legacy.mjs: | `legacy/x` | [`x`](url) | ...
const ROW = /^\|\s*`legacy\/([^`]+)`\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|(.*)$/gm;

export function buildExport(root) {
  const directory = resolve(root);
  const markdown = readFileSync(join(directory, "README.md"), "utf8");
  const sources = [];
  for (const [, folder, label, url, rest] of markdown.matchAll(ROW)) {
    const columns = rest.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
    sources.push({
      folder: folder.trim(),
      originalRepo: url.trim(),
      label: label.trim().replace(/^`|`$/g, ""),
      kb: Number.parseInt(columns[0], 10) || null,
      visibility: columns[1] || null,
      extra: columns.slice(2),
    });
  }
  const integrity = inspect(directory);
  return {
    repository: REPOSITORY,
    generatedAt: new Date().toISOString(),
    totalSources: sources.length,
    integrity,
    sources,
    note: "Export del manifiesto y del estado de integridad; el contenido de legacy/ permanece privado y no se exporta.",
  };
}

function main(argv) {
  const outIndex = argv.indexOf("--out");
  const json = JSON.stringify(buildExport(fileURLToPath(new URL("..", import.meta.url))), null, 2) + "\n";
  if (outIndex !== -1 && argv[outIndex + 1]) {
    const target = resolve(argv[outIndex + 1]);
    writeFileSync(target, json);
    console.error(`Export escrito en ${target}`);
  } else {
    process.stdout.write(json);
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
