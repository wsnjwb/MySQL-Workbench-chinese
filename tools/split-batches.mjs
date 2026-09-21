import fs from "node:fs";

const list = JSON.parse(fs.readFileSync("translate-list.json", "utf8"));
const BATCH = Number(process.argv[2] ?? 175);
const outDir = process.argv[3] ?? "batches";
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) fs.rmSync(`${outDir}/${f}`);

let i = 0;
let n = 0;
for (let start = 0; start < list.length; start += BATCH) {
  const chunk = list.slice(start, start + BATCH);
  n++;
  const name = `batch-${String(n).padStart(2, "0")}`;
  fs.writeFileSync(`${outDir}/${name}.json`, JSON.stringify(chunk.map(([s]) => s), null, 1), "utf8");
  i += chunk.length;
}
console.log(`batches=${n} entries=${i}`);
