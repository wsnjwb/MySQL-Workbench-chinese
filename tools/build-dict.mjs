/*
 * Merge the translated batches with the curated core dictionary and generate
 * the deployable artifacts:
 *   dist/frontend/build/i18n-zh/renderer-zh.js  (renderer runtime layer)
 *   dist/src/i18n-zh.cjs                        (main process menu/dialog layer)
 *   dist/frontend/build/i18n-zh/zh-CN.json      (plain dictionary, for reference)
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");

const merged = {};
const sources = {};
const conflicts = [];
let batchFiles = 0;

const readBatches = (dir, nameRe) => {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir).filter((f) => nameRe.test(f)).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    batchFiles++;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== "string" || value.trim() === "") continue;
      if (value === key) continue;
      if (merged[key] !== undefined && merged[key] !== value) {
        // Keep the first translation; log conflicts for review.
        conflicts.push([key, merged[key], value, sources[key], file]);
        continue;
      }
      merged[key] = value;
      sources[key] = file;
    }
  }
};

readBatches(outDir, /^batch-\d+\.json$/);
readBatches(path.join(root, "out2"), /^batch2-\d+\.json$/);

const core = JSON.parse(fs.readFileSync(path.join(root, "dict", "core-override.json"), "utf8"));
for (const [key, value] of Object.entries(core)) {
  merged[key] = value;
  sources[key] = "core-override";
}

const extra = JSON.parse(fs.readFileSync(path.join(root, "dict", "core-extra.json"), "utf8"));
for (const [key, value] of Object.entries(extra)) {
  if (merged[key] === undefined) {
    merged[key] = value;
    sources[key] = "core-extra";
  }
}

// Stable, readable ordering for diffs.
const sorted = {};
for (const key of Object.keys(merged).sort((a, b) => a.localeCompare(b, "en"))) {
  sorted[key] = merged[key];
}

const patterns = [
  ["^(\\\\d[\\\\d,]*)\\\\s+rows?\\\\s+affected\\\\.?$", "i", "$1 行受影响"],
  ["^(\\\\d[\\\\d,]*)\\\\s+rows?\\\\s+in\\\\s+set.*$", "i", "$1 行记录"],
  ["^(\\\\d[\\\\d,]*)\\\\s+row\\\\s+in\\\\s+set.*$", "i", "$1 行记录"],
  ["^Select up to (\\\\d+) tags to display with the connection\\\\.$", "i", "最多可选择 $1 个标签随连接显示。"],
  ["^New Connection (\\\\d+)$", "", "新建连接 $1"],
  ["^(\\\\d+) rows? returned\\\\.?$", "i", "返回 $1 行"],
];

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dict", "zh-CN.json"), JSON.stringify(sorted, null, 1), "utf8");

const dictLiteral = JSON.stringify(sorted, null, 0);
const patternLiteral = JSON.stringify(patterns, null, 0);

const rendererSrc = fs.readFileSync(path.join(root, "src", "renderer-zh.template.js"), "utf8");
const rendererOut = rendererSrc
  .replace("__DICT__", dictLiteral)
  .replace("__PATTERNS__", patternLiteral);

const mainSrc = fs.readFileSync(path.join(root, "src", "i18n-zh-main.template.cjs"), "utf8");
const mainOut = mainSrc.replace("__DICT__", dictLiteral);

const outRendererDir = path.join(root, "dist", "frontend", "build", "i18n-zh");
fs.mkdirSync(outRendererDir, { recursive: true });
fs.mkdirSync(path.join(root, "dist", "src"), { recursive: true });
fs.writeFileSync(path.join(outRendererDir, "renderer-zh.js"), rendererOut, "utf8");
fs.writeFileSync(path.join(outRendererDir, "zh-CN.json"), JSON.stringify(sorted, null, 1), "utf8");
fs.writeFileSync(path.join(root, "dist", "src", "i18n-zh.cjs"), mainOut, "utf8");

console.log(`batches merged : ${batchFiles}`);
console.log(`dictionary keys: ${Object.keys(sorted).length}`);
console.log(`conflicts      : ${conflicts.length}`);
for (const [key, a, b, fa, fb] of conflicts.slice(0, 20)) {
  console.log(`  "${key}" kept "${a}" (${fa}) over "${b}" (${fb})`);
}
