import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../src/products.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "index.html"), "utf8");
assert.equal(products.length, 3);
assert.deepEqual(
  products.map((p) => p.size),
  ["1 L", "1 L", "250 ml"],
);
assert.equal(new Set(products.map((p) => p.id)).size, 3);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate HTML IDs");
const validIds = new Set([...ids, ...products.map((p) => `product-${p.id}`)]);
for (const m of html.matchAll(/href="#([^"]+)"/g))
  assert(validIds.has(m[1]), `Missing anchor ${m[1]}`);
const assets = new Set(
  [
    ...html.matchAll(
      /(?:src|href)="(\/(?:assets|fonts|src|downloads)\/[^"#]+)"/g,
    ),
  ].map((m) => m[1]),
);
products.forEach((p) => assets.add(p.image));
for (const asset of assets)
  await access(
    path.join(root, asset.startsWith("/src/") ? "" : "public", asset),
  );
assert(
  !html.includes('type="submit" class="button button-navy">'),
  "Enquiry submit must start disabled",
);
console.log(
  `Validated ${products.length} approved products, ${assets.size} local assets and all section anchors.`,
);
