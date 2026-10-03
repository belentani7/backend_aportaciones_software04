import fs from "node:fs";

const sourcePath = process.argv[2] ?? "drizzle/schema.ts";
const actualPath = process.argv[3] ?? "/tmp/docker-db-introspection/schema.ts";

function normalizeDefault(line) {
  const now = line.match(/\.defaultNow\(\)/);
  if (now) return "current_timestamp";
  const match = line.match(/\.default\(([^)]*)\)/);
  if (!match) return null;
  const normalized = match[1].trim().replace(/["'`]/g, "").toLowerCase();
  if (normalized === "true") return "1";
  if (normalized === "false") return "0";
  return normalized;
}

function normalizeType(line) {
  const match = line.match(/:\s*(\w+)\(([^)]*)\)([^\n]*)$/);
  if (!match) return null;
  let type = match[1].toLowerCase();
  if (type === "boolean" || type === "tinyint") type = "boolean";
  const args = match[2].replace(/\s+/g, "");
  const length = args.match(/length:?([0-9]+)/i)?.[1] ?? args.match(/^([0-9]+)$/)?.[1] ?? null;
  const precision = args.match(/precision:?([0-9]+)/i)?.[1] ?? null;
  const scale = args.match(/scale:?([0-9]+)/i)?.[1] ?? null;
  const enumValues = type.includes("enum")
    ? [...args.matchAll(/["']([^"']+)["']/g)].map((item) => item[1])
    : [];
  return {
    type,
    length,
    precision,
    scale,
    enumValues,
    notNull: /\.notNull\(\)/.test(line),
    default: normalizeDefault(line),
    onUpdate: /\.onUpdateNow\(\)/.test(line),
  };
}

function extractTables(text) {
  const tables = new Map();
  const tableRegex = /export const (\w+)\s*=\s*mysqlTable\(\s*["']([^"']+)["']\s*,([\s\S]*?)(?=\nexport const |$)/g;
  for (const match of text.matchAll(tableRegex)) {
    const [, symbol, tableName, block] = match;
    const body = block.split(/\n\s*\},\s*\(table\)/)[0].split(/\n\s*\}\);/)[0];
    const columns = new Map();
    const columnRegex = /^\s{1,}(\w+)\s*:\s*([^\n]+)$/gm;
    for (const column of body.matchAll(columnRegex)) {
      const [, property, line] = column;
      const nameMatch = line.match(/^[^\(]+\(\s*["']([^"']+)["']/);
      const name = nameMatch?.[1] ?? property;
      columns.set(name, normalizeType(line));
    }
    const indexes = [...block.matchAll(/(?:index|uniqueIndex|unique)\(\s*["']([^"']+)["']/g)].map((item) => item[1]);
    const uniqueFieldRegex = /^\s{1,}(\w+)\s*:\s*[^\n]*\.unique\(\)/gm;
    for (const field of body.matchAll(uniqueFieldRegex)) indexes.push(`${tableName}_${field[1]}_unique`);
    tables.set(tableName, { symbol, columns, indexes: [...new Set(indexes)] });
  }
  return tables;
}

const source = extractTables(fs.readFileSync(sourcePath, "utf8"));
const actual = extractTables(fs.readFileSync(actualPath, "utf8"));
const allTables = [...new Set([...source.keys(), ...actual.keys()])].sort();
const report = [];
for (const table of allTables) {
  const expected = source.get(table)?.columns ?? new Map();
  const observed = actual.get(table)?.columns ?? new Map();
  const missing = [...expected.keys()].filter((name) => !observed.has(name));
  const extra = [...observed.keys()].filter((name) => !expected.has(name));
  const typeMismatches = [...expected.keys()]
    .filter((name) => observed.has(name) && JSON.stringify(expected.get(name)) !== JSON.stringify(observed.get(name)))
    .map((name) => ({ column: name, expected: expected.get(name), observed: observed.get(name) }));
  const expectedIndexes = source.get(table)?.indexes ?? [];
  const observedIndexes = actual.get(table)?.indexes ?? [];
  const missingIndexes = expectedIndexes.filter((name) => !observedIndexes.includes(name));
  const extraIndexes = observedIndexes.filter((name) => !expectedIndexes.includes(name));
  report.push({ table, expected: expected.size, observed: observed.size, missing, extra, typeMismatches, expectedIndexes, observedIndexes, missingIndexes, extraIndexes });
}
console.log(JSON.stringify({ source: sourcePath, actual: actualPath, tables: report }, null, 2));
