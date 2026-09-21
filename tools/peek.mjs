import fs from "node:fs";
const c = JSON.parse(fs.readFileSync("candidates.json", "utf8"));
const from = Number(process.argv[2] ?? 0);
const to = Number(process.argv[3] ?? 200);
for (const [s, n] of c.slice(from, to)) console.log(String(n).padStart(4), JSON.stringify(s));
