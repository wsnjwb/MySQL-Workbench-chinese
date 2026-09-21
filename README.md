# MySQL Workbench 26.7 简体中文语言包

针对 **MySQL Workbench 26.7**（Oracle 新一代基于 Electron / MySQL Shell 的版本，非旧版 8.0）
的简体中文汉化包。

## 一、汉化原理

这一版 Workbench 是一个 Electron 应用：

- 界面文字（侧边栏、对话框、按钮、提示、右键菜单）由渲染进程的 JS 直接渲染到 DOM；
- 菜单栏是 Electron 原生菜单，**文字由渲染进程通过 IPC 传给主进程**后建成；
- 官方**没有**任何多语言 / i18n 机制，界面文字全部是英文硬编码。

因此汉化采用「运行时翻译层」，而不是改写打包后的业务代码：

| 层 | 文件 | 作用 |
| --- | --- | --- |
| 渲染进程 | `frontend/build/i18n-zh/renderer-zh.js` | 用 `MutationObserver` 监听 DOM，把界面文本、`title` / `placeholder` / `aria-label` 等属性替换为中文 |
| 主进程 | `src/i18n-zh.cjs` | 翻译 Electron 菜单（应用菜单 + 右键菜单）的 `label`，并翻译少数对话框标题 |
| 字典 | `frontend/build/i18n-zh/zh-CN.json` | 2348 条英文 → 中文对照（供查阅/二次编辑） |
| 入口 | `frontend/build/index.html` | 注入一行 `<script src="i18n-zh/renderer-zh.js">` |
| 入口 | `src/main.cjs` | 引入 `i18n-zh.cjs`、包装菜单模板、追加 `--lang=zh-CN` |

**关键设计：只翻译界面，不碰数据。**

以下区域被显式排除，永远不会被翻译：

- Monaco 编辑器内容（SQL 脚本、笔记本代码）
- **带列头的数据表格**（Tabulator，列名与单元格都是数据库内容）
- `<textarea>`、`contenteditable`、`script`、`style`
- `input` 的输入值（只翻译其 `placeholder` / `title` / `aria-label`）
- 文件路径、URL（菜单中形如 `C:\...\a.sql` 的项会被跳过）

### 数据表格与界面列表的区分

应用同时用 Tabulator 渲染**查询结果**和**界面列表/树**（连接树、设置页、模式树），
所以不能按 class 一刀切。判断依据是 Tabulator 的表头：

- 表头元素带 `tabulator-header-hidden`（即 `showHeader: false`）→ 是界面列表，**翻译**
- 表头可见 → 是数据表格，**整块跳过**（含列名与单元格）

另外 `id` 命中 `result|output|preview|json|schema|tableName|tableSchema|log` 的表格一律跳过。
实测：设置页 8 个小节、约 200 条文字全部命中；模拟的数据表格、Monaco 内容均未被改动。

此外 `--lang=zh-CN` 让 Chromium / Electron 自带的部分（文本框右键菜单、日期格式等）也走中文。

## 二、使用方法

### 前置条件

| 项目 | 要求 |
| --- | --- |
| 操作系统 | Windows（默认路径探测按 Windows 编写；macOS / Linux 需用参数指定安装目录） |
| MySQL Workbench | **26.7**（已在 26.7.0 上完整测试；其它版本可能因补丁锚点变化而失败） |
| Node.js | 18 或更高。**只有部署/卸载时需要**，汉化生效后不需要 Node |

### 安装

1. 把本项目下载到本地（`git clone`，或下载 ZIP 后解压）。
2. **完全退出 MySQL Workbench** —— 包括任务管理器里残留的后台进程，否则文件被占用。
3. 在项目目录执行：

   ```powershell
   node tools\deploy.mjs
   ```

   脚本会自动探测默认安装目录
   `%LOCALAPPDATA%\Programs\MySQL\MySQL Workbench`。
   若 Workbench 装在别处，把路径作为参数传入：

   ```powershell
   node tools\deploy.mjs "D:\Program Files\MySQL\MySQL Workbench"
   ```

4. 重新启动 MySQL Workbench。菜单栏应显示
   **文件 / 编辑 / 视图 / 运行 / 数据库 / 窗口 / 帮助**。

部署脚本会自动把原始文件备份到 `backup\<时间戳>\`，而且是**幂等**的 ——
重复执行只会更新字典文件，不会重复打补丁，也不会把文件改坏。

### 验证是否生效

| 检查点 | 说明 |
| --- | --- |
| 菜单栏是中文 | 主进程部分生效 |
| 打开 **帮助 → 首选项**，"常规 / 后台工作进程 / 主题设置" 为中文 | 渲染层生效 |

也可以直接看文件是否就位：

```powershell
Test-Path "$env:LOCALAPPDATA\Programs\MySQL\MySQL Workbench\resources\app\frontend\build\i18n-zh\renderer-zh.js"
```

返回 `True` 表示已部署。

### 临时关闭（不卸载）

在 Workbench 里按 `Ctrl+Shift+I` 打开 DevTools，执行：

```js
localStorage.setItem("mysqlwb-zh", "off")
```

然后重启。恢复用 `localStorage.removeItem("mysqlwb-zh")`。

### 卸载 / 还原

```powershell
node tools\uninstall.mjs
```

会从 `backup\` 还原原始的 `index.html` 与 `main.cjs`，并删除新增的 `i18n-zh` 文件。
该还原路径已测试：还原后与原文件**哈希一致**，无残留。

### 升级 Workbench 之后

Workbench 升级会覆盖 `index.html` 和 `main.cjs`，汉化随之失效。
按上面「安装」的步骤重跑一次 `node tools\deploy.mjs` 即可。

如果新版本改动了补丁锚点，脚本会**报错并中止**，不会写出半成品文件。
此时请提 issue 并附上 `resources\app\package.json` 里的版本号。

### 常见问题

**Q：报错 `not a MySQL Workbench install`**
默认路径没找到。在开始菜单快捷方式上右键 → 属性 → 目标，确认真实安装目录，
再作为参数传给脚本。

**Q：报错 `EPERM: operation not permitted`**
安装目录里的文件带 Windows 只读属性。`tools\deploy.mjs` 已经会自动清除该属性；
若仍失败，用**管理员身份**的 PowerShell 重试。

**Q：部署成功，界面却还是英文**
按顺序排查：
1. Workbench 是否**完全退出**后重新启动（主进程补丁必须重启才生效）；
2. 是否还有多个 Workbench 实例在运行；
3. `resources\app\frontend\build\index.html` 里是否存在这一行：
   `<script src="i18n-zh/renderer-zh.js"></script>`。

**Q：部分文字仍是英文**
属于已知现象，见文末「已知限制」。想自己补：把英文原文加到 `dict\core-extra.json`，
再执行 `node tools\build-dict.mjs` 和 `node tools\deploy.mjs`。

## 三、目录说明

```
workbench-zhcn/
├─ dict/
│  ├─ zh-CN.json          # 合并后的最终字典（构建产物，2348 条）
│  ├─ core-override.json  # 人工校对的核心词条（菜单、按钮、术语，优先级最高）
│  └─ core-extra.json     # 人工补充的常用界面词条
├─ src/
│  ├─ renderer-zh.template.js   # 渲染进程翻译层源码（含 __DICT__ 占位符）
│  └─ i18n-zh-main.template.cjs # 主进程翻译模块源码
├─ out/batch-*.json       # 第一轮分批翻译结果（常规扫描）
├─ out2/batch2-*.json     # 第二轮分批翻译结果（JSX 属性高精度扫描）
├─ batches/ batches2/     # 分批待翻译清单
├─ dist/                  # 构建产物（= 实际部署到 Workbench 的文件）
├─ backup/<时间戳>/       # 部署前对原始 index.html / main.cjs 的备份
└─ tools/                 # 工具脚本
```

### 词条是怎么找出来的

1. `tools/scan-strings.mjs` 扫描前端 bundle，提取全部 JS 字符串字面量（58,397 条）；
2. `tools/filter-candidates.mjs` 过滤出疑似界面文案 → 2,435 条，人工分批翻译；
3. `tools/extract-props.mjs` **高精度**提取 JSX 属性（`caption:` / `label:` / `description:` 等）
   的值 → 补出 804 条漏网词条（第一轮正则规则会误杀含反引号、花括号的长句）；
4. 人工补充 `dict/core-extra.json`、`dict/core-override.json`。

### 排查"还有哪里没翻译"的方法

应用可以带调试端口启动，然后用 CDP 直接读页面 DOM：

```powershell
Start-Process "MySQL Workbench.exe" -ArgumentList "--remote-debugging-port=9222"
node tools\cdp.mjs "@tools\collect-untranslated.js"   # 列出当前界面上所有未翻译文本
node tools\cdp.mjs "@tools\walk-settings.js"          # 逐个小节遍历设置页
node tools\cdp.mjs "@tools\selftest.js"               # 验证数据表格/Monaco 未被翻译
```

排查完记得正常重启应用（不要长期开着调试端口）。

## 四、开发者命令

```powershell
cd <本目录>

# 1) 合并字典并生成 dist（改动字典后必须执行）
node tools\build-dict.mjs

# 2) 部署到 Workbench（默认路径为 %LOCALAPPDATA%\Programs\MySQL\MySQL Workbench）
node tools\deploy.mjs
node tools\deploy.mjs "D:\其他路径\MySQL Workbench"

# 3) 卸载 / 还原
node tools\uninstall.mjs
```

部署脚本是**幂等**的：重复执行只会重新拷贝字典文件，不会重复打补丁。
升级 Workbench 后重新执行一次 `build-dict.mjs` + `deploy.mjs` 即可（新版本会覆盖 `index.html` 与 `main.cjs`）。

## 五、添加或修改翻译

1. 编辑 `dict/core-extra.json`（你自己的词条）或 `dict/core-override.json`（核心词条，优先级最高）；
   格式为 `"英文原文": "中文译文"`，**英文必须与界面完全一致（含大小写与标点）**。
2. 执行 `node tools\build-dict.mjs`。
3. 执行 `node tools\deploy.mjs`。
4. 重启 MySQL Workbench（`main.cjs` 的改动必须重启；纯字典改动刷新窗口即可）。

模式匹配（正则）在 `tools/build-dict.mjs` 的 `patterns` 数组中维护，例如：

```js
["^New Connection (\\d+)$", "", "新建连接 $1"],
```

## 六、已知限制

- **输入框内的默认值**（如新建连接时的标题 `New Connection 1`、描述 `A new Database Connection`）
  属于表单数据，不做翻译；`New Connection 1` 这类由正则规则处理。
- **动态拼接的句子**（英文片段 + 变量 + 片段）只能翻译其中完整的片段，可能出现中英混排。
- **被隐藏表头的数据表格**：判断依据是 `tabulator-header-hidden` 这个类名。如果某个数据表格
  以其它方式隐藏了列头，其单元格文字会被翻译（仅影响显示，不会改动数据库里的数据）。
- **无列头的树/列表里的用户数据**：连接树、模式树这类界面列表没有列头，因此会被翻译。
  如果某个连接名或对象名**正好等于**字典里的英文短语（例如把连接命名为 `Home`、把表命名为 `Users`），
  显示时会被替换成中文（同样只影响显示，不影响存储的数据）。
- **下拉框里必须是英文的值**（如语言名 `JavaScript` / `SQL`、字符集名、主题名）保留英文。
- Monaco 编辑器自身的右键菜单、以及状态栏中由 Monaco 渲染的文字，来自 `monaco-editor` 包，未汉化。
- `system-variables-*.js` / `system-functions-*.js` 中的 MySQL 服务器变量与函数说明（约 8000 条）
  属于参考资料，未汉化。
- AI 助手的提示词模板（发送给模型的英文文本）**刻意不翻译**，以免影响功能。
- **菜单栏已验证**（文件 / 编辑 / 视图 / 运行 / 数据库 / 窗口 / 帮助 及其子项均为中文）。
  原生右键菜单与弹出菜单走同一套翻译代码（`src/i18n-zh.cjs` 的 `translateMenuTemplate`），
  但没有单独截图验证 —— 空连接列表下右键不弹出菜单，且需要真实连接才能覆盖全部场景。
- 未连接的界面（欢迎页、连接管理、设置、迁移助手）已逐屏核对；
  **需要真实数据库连接的界面**（SQL 结果、模式浏览器、管理页）无法在无连接环境下核查，
  如发现遗漏可用「三、目录说明 → 排查"还有哪里没翻译"的方法」定位，
  或直接把英文加到 `dict/core-extra.json`。

