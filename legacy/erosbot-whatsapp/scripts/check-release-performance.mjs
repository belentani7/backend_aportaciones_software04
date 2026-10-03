import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const assetsDir = "dist/public/assets";
const assets = readdirSync(assetsDir)
  .map(name => ({ name, bytes: statSync(join(assetsDir, name)).size, gzipBytes: gzipSync(readFileSync(join(assetsDir, name))).length }))
  .sort((a, b) => b.bytes - a.bytes);

const largestAppChunk = assets.filter(asset => asset.name.endsWith(".js") && !asset.name.includes("vendor")).at(0);
const largestVendorChunk = assets.filter(asset => asset.name.endsWith(".js") && asset.name.includes("vendor")).at(0);
if (!largestAppChunk) throw new Error("No JavaScript app chunk found");
if (largestAppChunk.bytes > 420_000) throw new Error(`App chunk budget exceeded: ${largestAppChunk.name} (${largestAppChunk.bytes} bytes)`);
if (largestVendorChunk && largestVendorChunk.bytes > 500_000) throw new Error(`Vendor chunk budget exceeded: ${largestVendorChunk.name} (${largestVendorChunk.bytes} bytes)`);
console.log(JSON.stringify({ largestAppChunk, largestVendorChunk, assetCount: assets.length }, null, 2));
