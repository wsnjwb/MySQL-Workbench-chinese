(async () => {
  const dialog = document.querySelector("#settingsDialog");
  if (dialog) {
    const close = dialog.querySelector(".msg.button.imageOnly");
    if (close) {
      close.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      close.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      close.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  }
  await new Promise((r) => setTimeout(r, 1200));
  const dialogGone = !document.querySelector("#settingsDialog");
  const out = ["settings dialog closed: " + dialogGone];
  document.querySelectorAll("[title]").forEach((el) => {
    const t = el.getAttribute("title");
    if (!t) return;
    const cls = String(el.className || "").slice(0, 45);
    out.push("title=" + JSON.stringify(t) + "  tag=" + el.tagName + "  cls=" + cls + "  id=" + el.id);
  });
  return out.slice(0, 40).join("\n");
})()
