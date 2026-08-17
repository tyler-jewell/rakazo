import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { startLocalPostgres } from "../packages/db/src/local-postgres.ts";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "data");
const envPath = path.join(root, ".env");

const LOCAL_ENV: Record<string, string> = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://rakazo:rakazo@127.0.0.1:5433/rakazo",
  BETTER_AUTH_SECRET: "local-dev-auth-secret-at-least-32-chars",
  BETTER_AUTH_URL: "http://127.0.0.1:5173",
  API_URL: "http://127.0.0.1:3100",
  WEB_ORIGIN: "http://127.0.0.1:5173",
  ENCRYPTION_KEY: "local-dev-encryption-key-at-least-32",
  DATA_DIR: "./data",
  SANDBOX_PROVIDER: "fake",
  AGENT_RUNTIME: "scripted",
  WAKEUP_DRIVER: "memory",
  PG_POOL_MAX: "1",
  SIGNUPS_ENABLED: "true",
  OPENROUTER_API_KEY: "",
  E2B_API_KEY: "",
  DAYTONA_API_KEY: "",
  COMPOSIO_API_KEY: "",
};

function applyEnv() {
  for (const [key, value] of Object.entries(LOCAL_ENV)) {
    if (key.endsWith("_API_KEY")) {
      process.env[key] = "";
      continue;
    }
    process.env[key] ??= value;
  }
  process.env.SANDBOX_PROVIDER = "fake";
  process.env.AGENT_RUNTIME = "scripted";
  process.env.WAKEUP_DRIVER = "memory";
  process.env.PG_POOL_MAX = "1";
  process.env.OPENROUTER_API_KEY = "";
  process.env.E2B_API_KEY = "";
  process.env.DAYTONA_API_KEY = "";
  process.env.COMPOSIO_API_KEY = "";
}

function writeEnvFile() {
  if (existsSync(envPath)) return;
  writeFileSync(
    envPath,
    `${Object.entries(LOCAL_ENV)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")}\n`,
  );
}

function run(command: string, args: string[], extra: NodeJS.ProcessEnv = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...extra },
    stdio: "inherit",
  });
  return child;
}

async function waitForHealth(url: string, timeoutMs: number) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // API is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  applyEnv();
  writeEnvFile();
  const postgres = await startLocalPostgres({
    dataDir: path.join(dataDir, "pglite"),
    port: Number(new URL(process.env.DATABASE_URL!).port || 5433),
  });
  process.env.DATABASE_URL = postgres.url;
  console.log("local postgres ready", postgres.url);

  const children: ChildProcess[] = [];
  const stop = async () => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGTERM");
    }
    await postgres.stop();
  };

  process.once("SIGINT", () => void stop().then(() => process.exit(0)));
  process.once("SIGTERM", () => void stop().then(() => process.exit(0)));

  children.push(run("npx", ["--yes", "pnpm@9.15.0", "--filter", "@rakazo/api", "start"]));
  children.push(run("npx", ["--yes", "pnpm@9.15.0", "--filter", "@rakazo/web", "dev"]));

  const health = await waitForHealth("http://127.0.0.1:3100/health", 30_000);
  console.log("rakazo local ready", health);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
