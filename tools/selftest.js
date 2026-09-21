(async () => {
  // Synthetic safety test: inject the DOM shapes the overlay must distinguish.
  const host = document.createElement("div");
  host.id = "wb-zh-selftest";
  host.innerHTML = [
    // 1. data grid: real (visible) header -> must NOT be translated
    '<div class="tabulator" id="fake-data-grid">',
    '  <div class="tabulator-header"><div class="tabulator-col"><div class="tabulator-col-title">Cancel</div></div></div>',
    '  <div class="tabulator-table"><div class="tabulator-row"><div class="tabulator-cell">Cancel</div></div></div>',
    "</div>",
    // 2. UI list: header present but hidden -> MUST be translated
    '<div class="tabulator" id="fake-ui-list">',
    '  <div class="tabulator-header tabulator-header-hidden"><div class="tabulator-col"><div class="tabulator-col-title">Cancel</div></div></div>',
    '  <div class="tabulator-table"><div class="tabulator-row"><div class="tabulator-cell">Cancel</div></div></div>',
    "</div>",
    // 3. SQL editor -> must NOT be translated
    '<div class="monaco-editor"><div class="view-lines">Cancel</div></div>',
    // 4. ordinary UI text -> MUST be translated
    '<button id="fake-button">Cancel</button>',
  ].join("");
  document.body.appendChild(host);
  await new Promise((r) => setTimeout(r, 900));

  const text = (id) => {
    const el = document.getElementById(id);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "<missing>";
  };
  const result = {
    dataGrid_header: text("fake-data-grid").includes("Cancel") ? "protected OK" : "TRANSLATED (BAD)",
    dataGrid: text("fake-data-grid") === "Cancel Cancel" ? "protected OK" : text("fake-data-grid"),
    uiList: text("fake-ui-list").includes("取消") ? "translated OK" : text("fake-ui-list"),
    monaco: document.querySelector("#wb-zh-selftest .monaco-editor").textContent.trim() === "Cancel"
      ? "protected OK" : "TRANSLATED (BAD)",
    plainUi: document.getElementById("fake-button").textContent.trim() === "取消" ? "translated OK" : "BAD",
  };
  host.remove();
  return JSON.stringify(result, null, 2);
})()
