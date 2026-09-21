/*
 * Remove the Simplified Chinese language pack from a MySQL Workbench install.
 *   node tools/uninstall.mjs ["C:\path\to\MySQL Workbench"]
 *
 * Restores the backed-up originals when available, otherwise reverses the
 * patches textually. The dictionary project is left untouched.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const root = process.cwd();
const appDir = process.argv[2] ?? path.join(
  os.homedir(), "AppData", "Local", "Programs", "MySQL", "MySQL Workbench",
);
const resourcesApp = path.join(appDir, "resources", "app");

if (!fs.existsSync(resourcesApp)) {
  console.error(`ERROR: not a MySQL Workbench install: ${resourcesApp}`);
  process.exit(1);
}

const report = [];
const makeWritable = (file) => {
  try {
    fs.chmodSync(file, 0o666);
  } catch (error) {
    /* ignored */
  }
};

// Oldest backup first: that copy is always the pristine original.
const backupRoot = path.join(root, "backup");
const backups = fs.existsSync(backupRoot)
  ? fs.readdirSync(backupRoot).sort()
  : [];

const restore = (relative) => {
  const target = path.join(resourcesApp, relative);
  for (const stamp of backups) {
    const candidate = path.join(backupRoot, stamp, relative);
    if (fs.existsSync(candidate)) {
      makeWritable(target);
      fs.copyFileSync(candidate, target);
      report.push(`restored ${relative} from backup/${stamp}`);

      return true;
    }
  }

  return false;
};

const strip = (relative, removals) => {
  const target = path.join(resourcesApp, relative);
  if (!fs.existsSync(target)) return false;
  let code = fs.readFileSync(target, "utf8");
  let changed = false;
  for (const removal of removals) {
    if (code.includes(removal)) {
      code = code.split(removal).join("");
      changed = true;
    }
  }
  if (changed) {
    makeWritable(target);
    fs.writeFileSync(target, code, "utf8");
    report.push(`reverse-patched ${relative}`);
  }

  return changed;
};

if (!restore(path.join("frontend", "build", "index.html"))) {
  strip(path.join("frontend", "build", "index.html"),
    ['  <script src="i18n-zh/renderer-zh.js"></script>\n']);
}

if (!restore(path.join("src", "main.cjs"))) {
  strip(path.join("src", "main.cjs"), [
    "\n\n// MySQL Workbench Simplified Chinese language pack.\nconst { translateLabel, translateMenuTemplate } = require(\"./i18n-zh.cjs\");\n// Localize Chromium/Electron built-in UI (text field context menus, roles).\napp.commandLine.appendSwitch(\"lang\", \"zh-CN\");",
    "translateMenuTemplate(template)",
  ]);
  // The reverse patch above also needs the literal call sites restored.
  const mainPath = path.join(resourcesApp, "src", "main.cjs");
  if (fs.existsSync(mainPath)) {
    let code = fs.readFileSync(mainPath, "utf8");
    code = code
      .split("Menu.buildFromTemplate(translateMenuTemplate(").join("Menu.buildFromTemplate(")
      .split("dialog.showErrorBox(translateLabel(\"Save Failed\")").join('dialog.showErrorBox("Save Failed"')
      .split("translateLabel(\"Frontend Build Missing\")").join('"Frontend Build Missing"');
    makeWritable(mainPath);
    fs.writeFileSync(mainPath, code, "utf8");
    report.push("restored main.cjs call sites");
  }
}

const payloadDir = path.join(resourcesApp, "frontend", "build", "i18n-zh");
if (fs.existsSync(payloadDir)) {
  fs.rmSync(payloadDir, { recursive: true, force: true });
  report.push("removed frontend/build/i18n-zh");
}
const mainModule = path.join(resourcesApp, "src", "i18n-zh.cjs");
if (fs.existsSync(mainModule)) {
  makeWritable(mainModule);
  fs.rmSync(mainModule, { force: true });
  report.push("removed src/i18n-zh.cjs");
}

console.log(`install: ${appDir}`);
for (const line of report) console.log(`- ${line}`);
if (report.length === 0) console.log("- nothing to remove");
