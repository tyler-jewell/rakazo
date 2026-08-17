import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop pack targets", () => {
  it("packs macOS only", () => {
    const desktopRoot = path.resolve(import.meta.dirname, "..");
    const pkg = JSON.parse(readFileSync(path.join(desktopRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      build: { mac?: { icon?: string }; win?: unknown; linux?: unknown };
    };
    expect(pkg.scripts.pack).toContain("--mac");
    expect(pkg.scripts.pack).not.toMatch(/--win|--linux/);
    expect(pkg.build.mac).toBeTruthy();
    expect(pkg.build.mac?.icon).toBe("assets/icon.icns");
    expect(pkg.build.win).toBeUndefined();
    expect(pkg.build.linux).toBeUndefined();
    expect(existsSync(path.join(desktopRoot, "assets/icon.icns"))).toBe(true);
    expect(existsSync(path.join(desktopRoot, "assets/icon.png"))).toBe(true);
    expect(existsSync(path.join(desktopRoot, "assets/icon.ico"))).toBe(false);
    expect(existsSync(path.join(desktopRoot, "assets/icon-macos.png"))).toBe(false);
  });
});
