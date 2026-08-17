import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop pack targets", () => {
  it("packs macOS only", () => {
    const pkg = JSON.parse(
      readFileSync(path.resolve(import.meta.dirname, "../package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
      build: { mac?: unknown; win?: unknown; linux?: unknown };
    };
    expect(pkg.scripts.pack).toContain("--mac");
    expect(pkg.scripts.pack).not.toMatch(/--win|--linux/);
    expect(pkg.build.mac).toBeTruthy();
    expect(pkg.build.win).toBeUndefined();
    expect(pkg.build.linux).toBeUndefined();
  });
});
