import fs from "node:fs";
const code = fs.readFileSync(process.argv[2], "utf8");
const from = Number(process.argv[3]);
const len = Number(process.argv[4] ?? 3000);
console.log(code.slice(from, from + len).replace(/,(?=[A-Za-z])/g, ",\n"));
