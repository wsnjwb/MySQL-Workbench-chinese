(() => {
  const dialog = document.querySelector("#settingsDialog");
  if (!dialog) return "no settings dialog";
  const out = [];
  dialog.querySelectorAll("button,[role=button],[class*=close],[class*=Close]").forEach((el, i) => {
    if (i > 25) return;
    out.push([el.tagName, "cls=" + String(el.className).slice(0, 60), "title=" + el.getAttribute("title"), "text=" + (el.textContent || "").trim().slice(0, 20)].join(" | "));
  });
  return out.join("\n");
})()
