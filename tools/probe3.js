(async () => {
  const out = [];
  const src = await (await fetch("i18n-zh/renderer-zh.js")).text();
  out.push("script has isDataGrid: " + src.includes("isDataGrid"));
  out.push("script has GRID skip: " + src.includes("tabulator-col-title"));
  out.push("script size: " + src.length);

  const tree = document.querySelector("#settingsTree");
  const list = document.querySelector("#settingsValueList");
  for (const [name, grid] of [["#settingsTree", tree], ["#settingsValueList", list]]) {
    if (!grid) { out.push(name + ": missing"); continue; }
    out.push(name
      + " id=" + JSON.stringify(grid.id)
      + " headers=" + grid.querySelectorAll(".tabulator-col-title").length
      + " headersAll=" + grid.querySelectorAll(".tabulator-header").length
      + " cells=" + grid.querySelectorAll(".tabulator-cell").length
      + " classes=" + grid.className);
  }
  const cell = (tree || document).querySelector(".tabulator-cell");
  out.push("first cell text: " + JSON.stringify(cell && cell.textContent));
  return out.join("\n");
})()
