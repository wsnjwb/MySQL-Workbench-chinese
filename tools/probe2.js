(async () => {
  window.electronHost.postMessage({ command: "showPreferences" });
  await new Promise((r) => setTimeout(r, 3500));
  const tree = document.querySelector("#settingsTree");
  const list = document.querySelector("#settingsValueList");
  const collect = (root, n) => {
    if (!root) return ["<missing>"];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const out = [];
    let node;
    while ((node = walker.nextNode()) && out.length < n) {
      const value = node.nodeValue.trim();
      if (value) out.push(value);
    }
    return out;
  };
  return [
    "=== #settingsTree ===",
    collect(tree, 14).join(" | "),
    "=== #settingsValueList ===",
    collect(list, 26).join(" | "),
    "=== overlay stats ===",
    "translated=" + window.__WB_ZH__.translated,
  ].join("\n");
})()
