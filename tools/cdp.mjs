/*
 * Evaluate JavaScript inside the running MySQL Workbench renderer through the
 * Chrome DevTools Protocol. Requires the app to be started with
 * --remote-debugging-port=9222
 *   node tools/cdp.mjs "<js expression>"
 */
import fs from "node:fs";
const arg = process.argv[2] ?? "1+1";
const expr = arg.startsWith("@") ? fs.readFileSync(arg.slice(1), "utf8") : arg;
const port = process.argv[3] ?? "9222";

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
if (!page) {
  console.error("no page target", JSON.stringify(targets.map((t) => [t.type, t.url])));
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

const result = await new Promise((resolve) => {
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id === 1) resolve(message);
  };
  ws.send(JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: { expression: expr, returnByValue: true, awaitPromise: true, userGesture: false },
  }));
});

ws.close();
if (result.result?.exceptionDetails) {
  console.error(JSON.stringify(result.result.exceptionDetails, null, 2));
  process.exit(1);
}
const value = result.result?.result?.value;
console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
