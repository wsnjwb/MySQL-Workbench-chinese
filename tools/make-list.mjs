import fs from "node:fs";

const c = JSON.parse(fs.readFileSync("candidates.json", "utf8"));

const NOISE = [
  /^(source|text|markup|meta|punctuation|keyword|entity|variable|constant|support|storage|string|comment|invalid|generic|token)\./i,
  /^(minmax|calc|translate|rgba?|linear-gradient|[a-z-]+-)\(/,
  /^[a-z-]+\s*[:(]/i,
  /^\d/,
  /^(ico|tds|codicon|monaco|tabulator|vscode)[-_]/i,
  /^(AND|OR|NOT|SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|SHOW|GRANT|REVOKE|LOCK|UNLOCK|SET|USE|CALL|BEGIN|COMMIT|ROLLBACK)\b.*['"`(]/,
];
const CORE_HINT = /^(Cancel|OK|Close|Save|Open|Delete|Edit|Add|Remove|New|Yes|No|Apply|Reset|Back|Next|Finish|Help|About|File|Edit|View|Run|Window|Developer|Help|Search|Copy|Cut|Paste|Undo|Redo|Select|Refresh|Reload|Retry|Ignore|Continue|Discard|Confirm|Error|Warning|Information|Settings|Preferences|Advanced|General)$/;

const keep = [];
for (const [s, n] of c) {
  if (NOISE.some((re) => re.test(s))) continue;
  // markdown-emphasis prompt templates
  if (/_?\*\*/.test(s)) continue;
  if (/\$\{|`/.test(s)) continue;
  if (/[{}]/.test(s)) continue;
  if (/(^|\s)(e|t|n|i|o|r|a|s|l|c|d|u|p|h|f|g|m|v|w|y|b|k|x|j|q|z)(=|\.|,|\))/.test(s)) continue; // minified code fragments
  if (s.length > 160) continue;
  keep.push([s, n]);
}

const scored = keep.map(([s, n]) => {
  let score = n * 10;
  if (CORE_HINT.test(s)) score += 500;
  if (/^[A-Z][a-z]+( [A-Za-z]+){0,4}$/.test(s) && s.length <= 30) score += 60; // short title-like
  if (/[.:?!]$/.test(s)) score += 20;                                          // sentence
  if (s.split(" ").length > 6) score -= 15;                                    // long sentences less likely core
  return [s, n, score];
}).sort((a, b) => b[2] - a[2]);

fs.writeFileSync("translate-list.json", JSON.stringify(scored.map(([s, n]) => [s, n]), null, 1));
fs.writeFileSync("translate-list.txt", scored.map(([s, n]) => `${String(n).padStart(4)} ${s}`).join("\n"), "utf8");
console.log("kept:", scored.length);
console.log("core-ish (score>=500):", scored.filter((x) => x[2] >= 500).length);
for (const [s, n, sc] of scored.slice(0, 60)) console.log(String(sc).padStart(5), String(n).padStart(3), JSON.stringify(s));
