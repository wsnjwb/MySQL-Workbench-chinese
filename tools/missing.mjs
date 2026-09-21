import fs from "node:fs";
const dict = JSON.parse(fs.readFileSync("dict/zh-CN.json", "utf8"));
const list = JSON.parse(fs.readFileSync("translate-list.json", "utf8"));
const missing = list.filter(([s]) => dict[s] === undefined);
fs.writeFileSync("missing.txt", missing.map(([s, n]) => `${String(n).padStart(4)} ${s}`).join("\n"), "utf8");
console.log("missing:", missing.length, "of", list.length);
const limit = Number(process.argv[2] ?? 120);
for (const [s, n] of missing.slice(0, limit)) console.log(String(n).padStart(4), JSON.stringify(s));
