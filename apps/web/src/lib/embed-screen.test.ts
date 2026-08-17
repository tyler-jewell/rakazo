import { describe, expect, it } from "vitest";
import { addScreenProxyCapability } from "../../../api/src/screen-proxy.js";
import { embeddableScreenUrl } from "./embed-screen.js";

describe("embeddable computer screen", () => {
  it("embeds the signed same-origin screen URL the API mints", () => {
    const sessionUrl = "http://127.0.0.1:49152/embed.html";
    const page = "http://127.0.0.1:5173/app/bot";
    expect(embeddableScreenUrl(sessionUrl, page)).toBeNull();

    const proxied = addScreenProxyCapability(sessionUrl, "screen-secret", "http://127.0.0.1:5173");
    const embedded = embeddableScreenUrl(proxied, page);
    expect(embedded).toBe(proxied);
    expect(embedded).toMatch(/^http:\/\/127\.0\.0\.1:5173\/novnc\//);
    expect(embedded).toContain("/embed.html");
  });
});
