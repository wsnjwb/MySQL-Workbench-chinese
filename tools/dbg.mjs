import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
console.log("DIR:", dir, "exists:", fs.existsSync(dir));
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
console.log("js files:", files.length, files.slice(0,5).join(", "));
const code = fs.readFileSync(path.join(dir, "ApplicationHost-QGx949WF.js"), "utf8");
const m = code.match(/id:"[A-Za-z0-9]*(Grid|Tree|Table|List)[A-Za-z0-9]*"/g) || [];
console.log("matches:", m.length, [...new Set(m)].slice(0, 40).join(" "));
