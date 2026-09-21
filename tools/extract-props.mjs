/*
 * High precision pass: collect string literals that are used as JSX/component
 * properties, which are almost always user visible interface text.
 *   node tools/extract-props.mjs <assetsDir> <out.json>
 */
import fs from "node:fs";
import path from "node:path";

const [, , dir, out] = process.argv;
const dict = JSON.parse(fs.readFileSync("dict/zh-CN.json", "utf8"));

const PROPS = [
  "caption", "label", "title", "placeholder", "description", "tooltip", "text",
  "header", "message", "children", "value", "captionAction", "subText", "hint",
  "errorText", "warningText", "infoText", "helpText", "checkboxLabel", "buttonLabel",
];
const propRe = new RegExp(`(?:^|[,{(\\s])(${PROPS.join("|")}):"((?:[^"\\\\]|\\\\.)*)"`, "g");

const files = fs.readdirSync(dir).filter((f) => /^(index-|ApplicationHost-|MigrationSubApp-|AnimatedProgressIndicator-|CommunicationDebugger-|FileViewer-|Search-|rdbms-info-|PieGraphProxy-|GraphProxy-|msg-|query-|simple-functions-|web-functions-|builtin-functions-|console\.worker)/.test(f));

const found = new Map();
for (const file of files) {
  const code = fs.readFileSync(path.join(dir, file), "utf8");
  let m;
  propRe.lastIndex = 0;
  while ((m = propRe.exec(code))) {
    let s;
    try {
      s = JSON.parse(`"${m[2]}"`);
    } catch {
      continue;
    }
    if (!s) continue;
    if (dict[s] !== undefined) continue;
    found.set(s, (found.get(s) ?? 0) + 1);
  }
}

const isUi = (s) => {
  if (s.length < 2 || s.length > 260) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (!/\s/.test(s) && !/^[A-Z][a-z]{2,}$/.test(s)) return false;   // need a space or Titlecase word
  if (/^[a-z][A-Za-z0-9-]*$/.test(s)) return false;                  // camelCase / kebab token
  if (/^https?:/.test(s)) return false;
  if (/^[-\w.]+\.[a-z]{2,5}$/.test(s)) return false;                 // file name
  if (/^[a-z-]+\s*:/.test(s)) return false;                          // css
  if (/%|rgba?\(|px\)/.test(s) && !/\s[A-Za-z]+\s/.test(s)) return false;
  if (/^[A-Z0-9_]+$/.test(s)) return false;
  if (/#[0-9a-f]{3,8}$/i.test(s)) return false;
  if (/^[\d\s.,:+-]+$/.test(s)) return false;
  return true;
};

const candidates = [...found.entries()].filter(([s]) => isUi(s)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
fs.writeFileSync(out, JSON.stringify(candidates, null, 1));
console.log("files:", files.length, "new candidates:", candidates.length);
for (const [s, c] of candidates.slice(0, 60)) console.log(String(c).padStart(4), JSON.stringify(s));
