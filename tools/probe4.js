(() => {
  const out = [];
  for (const id of ["settingsTree", "settingsValueList"]) {
    const grid = document.getElementById(id);
    if (!grid) { out.push(id + ": missing"); continue; }
    const header = grid.querySelector(".tabulator-header");
    const title = grid.querySelector(".tabulator-col-title");
    const style = header ? getComputedStyle(header) : null;
    out.push([
      id,
      "headerRect=" + JSON.stringify(header && header.getBoundingClientRect().height),
      "titleRect=" + JSON.stringify(title && title.getBoundingClientRect().height),
      "display=" + (style && style.display),
      "visibility=" + (style && style.visibility),
      "headerClass=" + (header && header.className),
    ].join("  "));
  }
  return out.join("\n");
})()
