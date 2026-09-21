import fs from "node:fs";
const d = JSON.parse(fs.readFileSync("strings-raw.json", "utf8"));
const rows = Object.entries(d.files).map(([f, s]) => [f, new Set(s.map((x) => x[0])).size]).sort((a, b) => b[1] - a[1]);
for (const [f, c] of rows) console.log(String(c).padStart(7), f);
