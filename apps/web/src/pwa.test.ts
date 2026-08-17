import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { registerServiceWorker, SERVICE_WORKER_URL } from "./pwa";

const webRoot = path.resolve(import.meta.dirname, "..");

describe("PWA install surface", () => {
  it("ships a web app manifest with the installable fields", () => {
    const html = readFileSync(path.join(webRoot, "index.html"), "utf8");
    expect(html).toMatch(/rel="manifest"\s+href="\/site\.webmanifest"/);

    const manifest = JSON.parse(
      readFileSync(path.join(webRoot, "public/site.webmanifest"), "utf8"),
    ) as {
      name?: string;
      short_name?: string;
      start_url?: string;
      display?: string;
      icons?: Array<{ src: string; sizes: string }>;
    };
    expect(manifest.name || manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"]).toContain(
      manifest.display,
    );
    const sizes = new Set((manifest.icons ?? []).map((icon) => icon.sizes));
    expect(sizes.has("192x192")).toBe(true);
    expect(sizes.has("512x512")).toBe(true);
  });

  it("registers the shipped service worker, which handles fetch", async () => {
    const sw = readFileSync(path.join(webRoot, "public/sw.js"), "utf8");
    expect(sw).toMatch(/addEventListener\(\s*["']fetch["']/);
    expect(sw).toMatch(/event\.respondWith/);

    const registered: string[] = [];
    await registerServiceWorker({
      register: async (url) => {
        registered.push(String(url));
        return undefined as never;
      },
    });
    expect(SERVICE_WORKER_URL).toBe("/sw.js");
    expect(registered).toEqual([SERVICE_WORKER_URL]);
  });
});
