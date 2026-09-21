import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const re = new RegExp(process.argv[3], "g");
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".js")) continue;
  if (/monaco|worker|tabulator-tables|dependencies|system-|keywords/.test(f)) continue;
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  const hits = new Map();
  let m;
  while ((m = re.exec(code))) {
    const key = m[0].slice(0, 80);
    hits.set(key, (hits.get(key) ?? 0) + 1);
  }
  if (hits.size) {
    console.log(`--- ${f}`);
    for (const [k, c] of [...hits].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(3)}  ${k}`);
  }
}
