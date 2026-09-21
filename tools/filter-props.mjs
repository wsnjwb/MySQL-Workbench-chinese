import fs from "node:fs";

const list = JSON.parse(fs.readFileSync("props-missing.json", "utf8"));

const CHARSET = /^(UTF-|UCS-|7bit|ARMSCII|Big5|DEC |DOS |EUC-|GB2312|GBK|GEOSTD8|HP |ISO 8859|KOI8|Mac |SJIS|TIS620|UJIS|US ASCII|Windows |cp\d|ascii|utf8|utf16|utf32|ucs2|latin\d|binary)/i;
const CODEISH = /[`{}]|^```|\\n|^\s*[<([]|=>|\bconsole\.|\bfunction\b|\bconst\b|\breturn\b/;

const kept = [];
const dropped = [];
for (const [s, n] of list) {
  if (CHARSET.test(s)) { dropped.push([s, "charset"]); continue; }
  if (CODEISH.test(s)) { dropped.push([s, "code"]); continue; }
  if (s.length > 240) { dropped.push([s, "too-long"]); continue; }
  kept.push([s, n]);
}

fs.mkdirSync("batches2", { recursive: true });
for (const f of fs.readdirSync("batches2")) fs.rmSync(`batches2/${f}`);

const BATCH = 175;
let n = 0;
for (let i = 0; i < kept.length; i += BATCH) {
  n++;
  fs.writeFileSync(`batches2/batch2-${String(n).padStart(2, "0")}.json`,
    JSON.stringify(kept.slice(i, i + BATCH).map(([s]) => s), null, 1), "utf8");
}
fs.writeFileSync("props-dropped.json", JSON.stringify(dropped, null, 1));
console.log(`kept=${kept.length} dropped=${dropped.length} batches=${n}`);
