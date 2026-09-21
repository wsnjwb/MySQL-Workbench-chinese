import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync("strings-raw.json", "utf8"));

// Files that belong to the Workbench application UI (not third-party editor internals).
const APP_FILE_RE = /^(index-|ApplicationHost-|MigrationSubApp-|AnimatedProgressIndicator-|CommunicationDebugger-|FileViewer-|Search-|rdbms-info-|PieGraphProxy-|GraphProxy-|msg-|query-|simple-functions-|web-functions-|mysql-|builtin-functions-|console\.worker)/;
// MySQL server reference data - huge, low priority, excluded by default.
const SKIP_FILE_RE = /^(system-variables-|system-functions-|keywords-|dependencies-|monaco-editor-|tabulator-tables-)/;

const looksLikeUiText = (s) => {
  if (s.length < 2 || s.length > 200) return false;
  if (!/[A-Za-z]/.test(s)) return false;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) return false;
  if (s.includes("\n") || s.includes("\t")) return false;
  // paths, urls, uris, css, html tags, globs, mime types
  if (/^[a-zA-Z]+:\/\//.test(s)) return false;
  if (/^[.\/~]/.test(s)) return false;
  if (/^[-\w.]+\.[a-z]{2,5}$/.test(s) && !s.includes(" ")) return false;
  if (/^[a-z0-9_-]+$/.test(s)) return false;              // lowercase identifiers/keys
  if (/^[A-Z][A-Z0-9_]*$/.test(s)) return false;          // SCREAMING_CASE
  if (/^[a-z][A-Za-z0-9]*$/.test(s) && !/^[a-z]+$/.test(s)) return false; // camelCase
  if (/^[a-z0-9_]+$/.test(s)) return false;
  if (/^(rgba?|hsla?)\(/.test(s)) return false;
  if (/^(var|calc|url)\(/.test(s)) return false;
  if (/^[a-z-]+\s*:\s*[^ ]+;/.test(s)) return false;      // css declaration
  if (/^[\d\s.,%:+-]+$/.test(s)) return false;            // numbers
  if (/^#?[0-9a-fA-F]{3,8}$/.test(s)) return false;        // color
  if (/^[<>{}[\]()[\],.;:!?/\\|=+*&^%$#@~`"'-]+$/.test(s)) return false;
  if (/[{}]/.test(s) && /[a-z]+\(/.test(s)) return false;  // code snippets
  if (/^(function|const|var|let|return|import|export|class|=>)/.test(s)) return false;
  // needs a space, or a capitalized/punctuated sentence-like token
  const hasSpace = / /.test(s);
  const sentenceLike = /^[A-Z]/.test(s) && (/[a-z]/.test(s) || /[.:?!]$/.test(s));
  if (!hasSpace && !sentenceLike) return false;
  if (!hasSpace && s.split(/[^A-Za-z]/).filter(Boolean).length < 1) return false;
  // camelCase technical tokens with no space
  if (!hasSpace && /^[a-z]+[A-Z]/.test(s)) return false;
  if (!hasSpace && /[{}()<>=;]/.test(s)) return false;
  // code-ish
  if (/;\s*$/.test(s) && /[a-z]\s*[=(]/.test(s)) return false;
  if (/^(GET|POST|PUT|DELETE|PATCH)\s/.test(s)) return false;
  return true;
};

const result = new Map();
const perFile = new Map();
for (const [file, list] of Object.entries(raw.files)) {
  if (SKIP_FILE_RE.test(file)) continue;
  if (!APP_FILE_RE.test(file)) continue;
  const bucket = perFile.get(file) ?? [];
  for (const [s, count] of list) {
    if (!looksLikeUiText(s)) continue;
    result.set(s, (result.get(s) ?? 0) + count);
    bucket.push([s, count]);
  }
  perFile.set(file, bucket);
}

const candidates = [...result.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
fs.writeFileSync("candidates.json", JSON.stringify(candidates, null, 1));
const perOut = {};
for (const [k, v] of perFile) perOut[k] = v.sort((a, b) => b[1] - a[1]);
fs.writeFileSync("candidates-by-file.json", JSON.stringify(perOut, null, 1));

console.log("candidates:", candidates.length);
for (const f of Object.keys(perFile)) console.log(String(perFile.get(f).length).padStart(6), f);
console.log("\n--- first 120 candidates ---");
for (const [s, c] of candidates.slice(0, 120)) console.log(String(c).padStart(4), JSON.stringify(s));
