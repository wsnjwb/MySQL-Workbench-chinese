import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const pattern = new RegExp(process.argv[3], "gi");
const ctx = Number(process.argv[4] ?? 120);
const only = process.argv[5];

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".js")) continue;
  if (only && !f.startsWith(only)) continue;
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  let m;
  let shown = 0;
  pattern.lastIndex = 0;
  while ((m = pattern.exec(code))) {
    if (shown++ > 25) break;
    const s = Math.max(0, m.index - ctx);
    const e = Math.min(code.length, m.index + m[0].length + ctx);
    console.log(`--- ${f} @${m.index}`);
    console.log(code.slice(s, e).replace(/\n/g, "\\n"));
  }
}
