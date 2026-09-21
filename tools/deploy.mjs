/*
 * Deploy the Simplified Chinese language pack into a MySQL Workbench install.
 *   node tools/deploy.mjs ["C:\path\to\MySQL Workbench"]
 *
 * Source files are backed up under backup/<timestamp>/ before the first change,
 * and every patch is idempotent.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const root = process.cwd();
const appDir = process.argv[2] ?? path.join(
  os.homedir(), "AppData", "Local", "Programs", "MySQL", "MySQL Workbench",
);
const resourcesApp = path.join(appDir, "resources", "app");

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

if (!fs.existsSync(resourcesApp)) {
  fail(`not a MySQL Workbench install: ${resourcesApp} not found`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, "backup", stamp);

const backupFile = (relative) => {
  const source = path.join(resourcesApp, relative);
  if (!fs.existsSync(source)) return null;
  const target = path.join(backupDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return source;
};

// Installer-produced files carry the Windows read-only attribute.
const makeWritable = (file) => {
  try {
    fs.chmodSync(file, 0o666);
  } catch (error) {
    /* best effort; the write below will report a real failure */
  }
};

const report = [];

// --- 1. copy payload -------------------------------------------------------
const copyTree = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(src, dst);
    else fs.copyFileSync(src, dst);
  }
};

copyTree(path.join(root, "dist", "frontend", "build", "i18n-zh"),
  path.join(resourcesApp, "frontend", "build", "i18n-zh"));
fs.copyFileSync(path.join(root, "dist", "src", "i18n-zh.cjs"),
  path.join(resourcesApp, "src", "i18n-zh.cjs"));
report.push("copied i18n-zh payload (renderer layer + dictionary + main module)");

// --- 2. patch index.html ---------------------------------------------------
const indexPath = path.join(resourcesApp, "frontend", "build", "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");
if (indexHtml.includes("i18n-zh/renderer-zh.js")) {
  report.push("index.html already patched - skipped");
} else {
  backupFile(path.join("frontend", "build", "index.html"));
  makeWritable(indexPath);
  const marker = '<script type="module"';
  const position = indexHtml.indexOf(marker);
  if (position < 0) fail("cannot find the module script tag in index.html");
  const tag = '  <script src="i18n-zh/renderer-zh.js"></script>\n  ';
  indexHtml = indexHtml.slice(0, position) + tag + indexHtml.slice(position);
  fs.writeFileSync(indexPath, indexHtml, "utf8");
  report.push("patched index.html (injected renderer-zh.js before the app bootstrap)");
}

// --- 3. patch main.cjs -----------------------------------------------------
const mainPath = path.join(resourcesApp, "src", "main.cjs");
let mainCode = fs.readFileSync(mainPath, "utf8");
if (mainCode.includes('require("./i18n-zh.cjs")')) {
  report.push("main.cjs already patched - skipped");
} else {
  backupFile(path.join("src", "main.cjs"));
  makeWritable(mainPath);

  const requireAnchor = 'const { buildNativeMenuTemplate, resolvePositioningItem, translatePopupCoordinates } = require("./native-menu.cjs");';
  if (!mainCode.includes(requireAnchor)) fail("cannot find the native-menu require line in main.cjs");
  mainCode = mainCode.replace(requireAnchor, [
    requireAnchor,
    '',
    '// MySQL Workbench Simplified Chinese language pack.',
    'const { translateLabel, translateMenuTemplate } = require("./i18n-zh.cjs");',
    '// Localize Chromium/Electron built-in UI (text field context menus, roles).',
    'app.commandLine.appendSwitch("lang", "zh-CN");',
  ].join("\n"));

  const menuAnchors = [
    ["return Menu.buildFromTemplate(template);", "return Menu.buildFromTemplate(translateMenuTemplate(template));"],
    ["const menu = Menu.buildFromTemplate(template);", "const menu = Menu.buildFromTemplate(translateMenuTemplate(template));"],
  ];
  let patchedMenus = 0;
  for (const [from, to] of menuAnchors) {
    if (!mainCode.includes(from)) fail(`cannot find menu anchor: ${from}`);
    mainCode = mainCode.split(from).join(to);
    patchedMenus++;
  }

  const dialogAnchors = [
    ['dialog.showErrorBox("Save Failed"', 'dialog.showErrorBox(translateLabel("Save Failed")'],
    ['"Frontend Build Missing"', 'translateLabel("Frontend Build Missing")'],
  ];
  let patchedDialogs = 0;
  for (const [from, to] of dialogAnchors) {
    if (mainCode.includes(from)) {
      mainCode = mainCode.split(from).join(to);
      patchedDialogs++;
    }
  }

  fs.writeFileSync(mainPath, mainCode, "utf8");
  report.push(`patched main.cjs (menu translation x${patchedMenus}, dialogs x${patchedDialogs}, zh-CN locale switch)`);
}

// --- 4. report -------------------------------------------------------------
console.log(`install : ${appDir}`);
console.log(`backup  : ${fs.existsSync(backupDir) ? backupDir : "(no backup needed)"}`);
for (const line of report) console.log(`- ${line}`);
