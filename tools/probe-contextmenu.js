(async () => {
  const target = document.querySelector("#connectionBrowserConnectionsPanel")
    || document.querySelector("#connectionBrowserContent")
    || document.querySelector("#connectionSection");
  if (!target) return "connection host not found";
  const rect = target.getBoundingClientRect();
  const x = Math.round(rect.left + 40);
  const y = Math.round(rect.top + 60);
  const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2, buttons: 2 };
  target.dispatchEvent(new MouseEvent("contextmenu", opts));
  await new Promise((r) => setTimeout(r, 1500));
  return "contextmenu dispatched at " + x + "," + y + " on " + target.id;
})()
