(() => {
  const CJK = /[\u4e00-\u9fff]/;
  const found = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue;
    if (!raw) continue;
    const text = raw.trim();
    if (!text || text.length < 2 || CJK.test(text)) continue;
    if (!/[A-Za-z]{2}/.test(text)) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (parent.closest(".monaco-editor,.codicon,[data-wb-zh-skip],script,style,textarea")) continue;
    const grid = parent.closest(".tabulator");
    if (grid) {
      const header = grid.querySelector(".tabulator-header");
      if (header && !header.classList.contains("tabulator-header-hidden")) continue;
    }
    found.set(text, (found.get(text) ?? 0) + 1);
  }
  const sorted = [...found.keys()].sort((a, b) => b.length - a.length);
  return "UNTRANSLATED=" + sorted.length + "\n" + sorted.join("\n");
})()
