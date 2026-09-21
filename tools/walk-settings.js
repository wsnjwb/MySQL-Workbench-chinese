(async () => {
  const CJK = /[\u4e00-\u9fff]/;
  const skip = ".monaco-editor,.codicon,[data-wb-zh-skip],script,style,textarea";
  const found = new Map();

  const collect = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = (node.nodeValue || "").trim();
      if (!text || text.length < 2 || CJK.test(text) || !/[A-Za-z]{2}/.test(text)) continue;
      const parent = node.parentElement;
      if (!parent || parent.closest(skip)) continue;
      const grid = parent.closest(".tabulator");
      if (grid) {
        const header = grid.querySelector(".tabulator-header");
        if (header && !header.classList.contains("tabulator-header-hidden")) continue;
      }
      found.set(text, (found.get(text) ?? 0) + 1);
    }
  };

  let list = document.querySelector("#settingsValueList");
  let tree = document.querySelector("#settingsTree");
  if (!list || !tree) {
    window.electronHost.postMessage({ command: "showPreferences" });
    await new Promise((r) => setTimeout(r, 3500));
    list = document.querySelector("#settingsValueList");
    tree = document.querySelector("#settingsTree");
  }
  if (!list || !tree) return "settings dialog could not be opened";

  // Walk every section: click each tree row, then scroll its value list.
  const rows = [...tree.querySelectorAll(".tabulator-row")];
  for (let i = 0; i < rows.length; i++) {
    rows[i].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    rows[i].dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    rows[i].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));

    const holder = list.querySelector(".tabulator-tableholder") || list;
    holder.scrollTop = 0;
    await new Promise((r) => setTimeout(r, 400));
    collect();
    let guard = 0;
    let previous = -1;
    while (previous !== holder.scrollTop && guard++ < 40) {
      previous = holder.scrollTop;
      holder.scrollTop = previous + Math.max(80, holder.clientHeight - 60);
      await new Promise((r) => setTimeout(r, 350));
      collect();
    }
  }

  const left = [...found.keys()].sort((a, b) => b.length - a.length);
  return "SECTIONS=" + rows.length + " UNTRANSLATED=" + left.length + "\n" + left.join("\n");
})()
