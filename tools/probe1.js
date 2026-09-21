(async () => {
  window.electronHost.postMessage({ command: "showPreferences" });
  await new Promise((r) => setTimeout(r, 3000));
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  let hit = null;
  while ((n = walk.nextNode())) {
    if (n.nodeValue && n.nodeValue.trim() === "Auto Logout Timeout") { hit = n; break; }
  }
  if (!hit) return "TEXT NOT FOUND";
  const chain = [];
  let e = hit.parentElement;
  while (e && e !== document.body) {
    const cls = typeof e.className === "string" && e.className.trim()
      ? "." + e.className.trim().split(/\s+/).join(".") : "";
    chain.push(e.tagName + (e.id ? "#" + e.id : "") + cls);
    e = e.parentElement;
  }
  const skip = {
    tabulator: !!hit.parentElement.closest("[class*='tabulator']"),
    monaco: !!hit.parentElement.closest(".monaco-editor"),
    codicon: !!hit.parentElement.closest(".codicon"),
    contenteditable: !!hit.parentElement.closest("[contenteditable='true']"),
  };
  return "SKIP=" + JSON.stringify(skip) + "\nCHAIN: " + chain.join("\n   <- ");
})()
