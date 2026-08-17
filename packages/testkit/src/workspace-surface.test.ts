import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

const TOOLCHAIN = new Set([
  "@biomejs/biome",
  "@playwright/test",
  "@prisma/client",
  "@tailwindcss/vite",
  "@types/dockerode",
  "@types/node",
  "@types/pg",
  "@types/react",
  "@types/react-dom",
  "@vitejs/plugin-react",
  "fast-check",
  "prisma",
  "tsx",
  "turbo",
  "typescript",
  "vite",
  "vitest",
]);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === "generated" ||
      entry.name === "out"
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function readJson(file: string) {
  return JSON.parse(readFileSync(file, "utf8")) as {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
}

function packageDirs(): string[] {
  return [
    repoRoot,
    ...readdirSync(path.join(repoRoot, "apps"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(repoRoot, "apps", entry.name)),
    ...readdirSync(path.join(repoRoot, "packages"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(repoRoot, "packages", entry.name)),
    path.join(repoRoot, "infra/sandboxes/supervisor"),
  ].filter((dir) => existsSync(path.join(dir, "package.json")));
}

function declaredDeps(dir: string): string[] {
  const pkg = readJson(path.join(dir, "package.json"));
  return Object.keys({
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  }).filter((name) => !name.startsWith("@rakazo/"));
}

function packageSourceMentions(dir: string, dep: string): boolean {
  const escaped = dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const importPattern = new RegExp(
    String.raw`(?:from|import\(|require\(|@import)\s*['"]${escaped}(?:/[^'"]*)?['"]`,
  );
  return walk(dir).some((file) => {
    if (!/\.(ts|tsx|js|cjs|mjs|css|json)$/.test(file)) return false;
    if (file.endsWith("package.json")) return false;
    const text = readFileSync(file, "utf8");
    return importPattern.test(text);
  });
}

describe("workspace surface", () => {
  it("keeps the remaining app trees", () => {
    const apps = readdirSync(path.join(repoRoot, "apps"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(apps).toEqual(["api", "web", "worker"]);
  });

  it("imports every remaining declared third-party dependency", () => {
    const unused: string[] = [];
    for (const dir of packageDirs()) {
      for (const dep of declaredDeps(dir)) {
        if (TOOLCHAIN.has(dep)) continue;
        if (!packageSourceMentions(dir, dep)) unused.push(`${path.relative(repoRoot, dir)}:${dep}`);
      }
    }
    expect(unused).toEqual([]);
  });
});
