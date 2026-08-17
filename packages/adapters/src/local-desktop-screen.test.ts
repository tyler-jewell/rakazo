import { afterAll, describe, expect, it } from "vitest";
import { addScreenProxyCapability } from "../../../apps/api/src/screen-proxy.js";
import { FakeSandboxProvider } from "./fake-sandbox.js";
import { LOCAL_DESKTOP_HTML } from "./local-desktop-screen.js";

const ctx = {
  operationId: "1",
  traceId: "1",
  workspaceId: "w",
  userId: "u",
  signal: new AbortController().signal,
};

describe("local desktop screen", () => {
  const sandbox = new FakeSandboxProvider({ serveScreen: true });

  afterAll(async () => {
    await sandbox.close();
  });

  it("connectScreen serves an iframe-ready desktop page", async () => {
    const computer = await sandbox.provision({ botId: "desk", homePath: "/tmp/desk" }, ctx);
    const session = await sandbox.connectScreen(computer, { view: "stream" }, ctx);
    expect(session.mimeType).toBe("text/html");
    expect(session.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/embed\.html$/);

    const response = await fetch(session.url);
    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type")).toMatch(/text\/html/);
    const body = await response.text();
    expect(body).toBe(LOCAL_DESKTOP_HTML);
    expect(body).toContain("desktop-stream");
    expect(body).toContain('data-desktop-view="1"');
    expect(body).toContain("<canvas");
    expect(body).not.toMatch(/text\/plain/);
    const proxied = addScreenProxyCapability(session.url, "screen-secret", "http://127.0.0.1:5173");
    expect(proxied.startsWith("http://127.0.0.1:5173/novnc/")).toBe(true);
    expect(proxied).toContain("/embed.html");
    await sandbox.destroy(computer, ctx);
  });

  it("keeps the offline fake:// screen when serving is off", async () => {
    const offline = new FakeSandboxProvider();
    const computer = await offline.provision({ botId: "plain", homePath: "/tmp/plain" }, ctx);
    const session = await offline.connectScreen(computer, { view: "stream" }, ctx);
    expect(session.url).toBe(`fake://screen/${computer.id}`);
    await offline.destroy(computer, ctx);
  });
});
