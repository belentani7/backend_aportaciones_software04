import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspect } from "../scripts/check-legacy.mjs";

function fixture(t, names = ["sample-one", "sample-two"]) {
  const root = mkdtempSync(join(tmpdir(), "legacy-gate-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "legacy"));
  for (const name of names) {
    mkdirSync(join(root, "legacy", name));
    writeFileSync(join(root, "legacy", name, "source.txt"), "preserved source");
  }
  const rows = names.map(name => `| \`legacy/${name}\` | [\`${name}\`](https://github.com/belentani7/${name}) | 1 | private |`).join("\n");
  writeFileSync(join(root, "README.md"), `# Portfolio\n\n| Path | Source | Size | Visibility |\n|---|---|---|---|\n${rows}\n`);
  return root;
}
test("accepts complete private source map", (t) => {
  const root = fixture(t);
  const result = inspect(root);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.equal(result.expected, 2);
  assert.equal(result.present, 2);
  assert.deepEqual(result.missing, []);
});
test("reports vanished legacy source", (t) => {
  const root = fixture(t);
  rmSync(join(root, "legacy", "sample-one"), { recursive: true });
  const result = inspect(root);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["sample-one"]);
});
test("reports untracked additions rather than publishing them", (t) => {
  const root = fixture(t);
  mkdirSync(join(root, "legacy", "unknown-source"));
  const result = inspect(root);
  assert.equal(result.ok, false);
  assert.deepEqual(result.untracked, ["unknown-source"]);
});
test("catches mismatching source URLs", (t) => {
  const root = fixture(t);
  const readme = join(root, "README.md");
  const txt = readFileSync(readme, "utf8").replace("github.com/belentani7/sample-two", "github.com/belentani7/different-source");
  writeFileSync(readme, txt);
  assert.equal(inspect(root).ok, false);
  assert.ok(inspect(root).diagnostics.some(item => item.includes("Source URL")));
});
test("rejects symlinked legacy directory", (t) => {
  const root = fixture(t, ["source"]);
  rmSync(join(root, "legacy", "source"), { recursive: true });
  const outside = join(root, "outside");
  mkdirSync(outside);
  symlinkSync(outside, join(root, "legacy", "source"), "dir");
  const result = inspect(root);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some(item => item.includes("Unexpected file or link")));
});

test("rejects an empty source folder even when its name still matches README", (t) => {
  const root = fixture(t, ["source"]);
  rmSync(join(root, "legacy", "source", "source.txt"));
  const result = inspect(root);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.includes("Empty legacy source: source"));
});

test("rejects symlinks hidden inside a legacy source tree", (t) => {
  const root = fixture(t, ["source"]);
  mkdirSync(join(root, "legacy", "source", "nested"));
  const outside = join(root, "outside-private.txt");
  writeFileSync(outside, "not for export");
  symlinkSync(outside, join(root, "legacy", "source", "nested", "leak.txt"));
  const result = inspect(root);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some(item => item.includes("Nested symbolic link in legacy/: source/nested/leak.txt")));
});

test("accepts regular nested files without treating them as untracked projects", (t) => {
  const root = fixture(t, ["source"]);
  mkdirSync(join(root, "legacy", "source", "nested"));
  writeFileSync(join(root, "legacy", "source", "nested", "index.js"), "export const ok = true;");
  const result = inspect(root);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
});
