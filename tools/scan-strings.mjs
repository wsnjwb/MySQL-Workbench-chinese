// Extract JS string literals from the MySQL Workbench (Electron) frontend bundles.
// Usage: node scan-strings.mjs <inputDir> <outJson>
import fs from "node:fs";
import path from "node:path";

const [, , inputDir, outJson] = process.argv;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

const isIdStart = (c) => /[A-Za-z_$0-9]/.test(c ?? "");

// Very small JS scanner: collects string literal contents, skipping comments.
function scanStrings(code) {
  const found = [];
  let i = 0;
  const n = code.length;
  const readString = (quote) => {
    let out = "";
    i++;
    while (i < n) {
      const c = code[i];
      if (c === "\\") {
        const e = code[i + 1];
        i += 2;
        switch (e) {
          case "n": out += "\n"; break;
          case "t": out += "\t"; break;
          case "r": out += "\r"; break;
          case "b": out += "\b"; break;
          case "f": out += "\f"; break;
          case "v": out += "\v"; break;
          case "0": out += "\0"; break;
          case "x": {
            out += String.fromCharCode(parseInt(code.slice(i, i + 2), 16) || 0);
            i += 2;
            break;
          }
          case "u": {
            if (code[i] === "{") {
              const end = code.indexOf("}", i);
              out += String.fromCodePoint(parseInt(code.slice(i + 1, end), 16) || 0);
              i = end + 1;
            } else {
              out += String.fromCharCode(parseInt(code.slice(i, i + 4), 16) || 0);
              i += 4;
            }
            break;
          }
          case "\n": break;
          default: out += e ?? "";
        }
        continue;
      }
      if (c === quote) { i++; break; }
      if (c === "\n" && quote !== "`") { i++; break; }
      out += c;
      i++;
    }
    return out;
  };

  let prevToken = "";
  while (i < n) {
    const c = code[i];
    if (c === "/" && code[i + 1] === "/") {
      while (i < n && code[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && code[i + 1] === "*") {
      i += 2;
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") { found.push(readString(c)); prevToken = c; continue; }
    if (c === "`") {
      // Template literal: keep only if it has no ${} substitution.
      const start = i;
      i++;
      let simple = true;
      let buf = "";
      while (i < n) {
        const t = code[i];
        if (t === "\\") { buf += code[i + 1] ?? ""; i += 2; continue; }
        if (t === "$" && code[i + 1] === "{") { simple = false; }
        if (t === "`") { i++; break; }
        buf += t;
        i++;
      }
      if (simple) found.push(buf);
      else found.push("\u0000TEMPLATE:" + code.slice(start, i).length);
      prevToken = "`";
      continue;
    }
    if (c === "/") {
      // regex literal if previous meaningful token cannot end an expression
      const prev = prevToken;
      if (!prev || /[=(,:[!&|?{};+\-*%~^<>\n]/.test(prev)) {
        i++;
        let inClass = false;
        while (i < n) {
          const t = code[i];
          if (t === "\\") { i += 2; continue; }
          if (t === "[") inClass = true;
          else if (t === "]") inClass = false;
          else if (t === "/" && !inClass) { i++; break; }
          else if (t === "\n") break;
          i++;
        }
        while (i < n && /[a-z]/.test(code[i])) i++;
        prevToken = "/";
        continue;
      }
      i++;
      prevToken = "/";
      continue;
    }
    if (!/\s/.test(c)) prevToken = c;
    i++;
  }
  return found;
}

const files = walk(inputDir);
const counts = new Map();
const byFile = new Map();
for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  const rel = path.relative(inputDir, f);
  const local = new Map();
  for (const s of scanStrings(code)) {
    if (s.startsWith("\u0000TEMPLATE:")) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
    local.set(s, (local.get(s) ?? 0) + 1);
  }
  byFile.set(rel, [...local.entries()].sort((a, b) => b[1] - a[1]));
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
const filesObj = {};
for (const [k, v] of byFile) filesObj[k] = v;
fs.writeFileSync(outJson, JSON.stringify({ files: filesObj, counts: sorted }, null, 0));
console.log(`files=${files.length} uniqueStrings=${sorted.length}`);
