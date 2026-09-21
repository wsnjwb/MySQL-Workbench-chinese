import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
for (const f of fs.readdirSync(dir)) {
  if (!/^(index-|ApplicationHost-|MigrationSubApp-)/.test(f)) continue;
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  const ids = new Set((code.match(/id:"[A-Za-z0-9_-]+"/g) || []).map(s => s.slice(4, -1)));
  const interesting = [...ids].filter(i => /result|output|console|log|data|editor|grid|tree|list|table|json|preview|schema/i.test(i));
  console.log("--- " + f + " (" + ids.size + " ids)");
  console.log(interesting.join("  "));
}
