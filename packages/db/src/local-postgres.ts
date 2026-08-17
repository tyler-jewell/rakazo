import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Client } from "pg";

export interface LocalPostgres {
  url: string;
  host: string;
  port: number;
  stop: () => Promise<void>;
}

export async function startLocalPostgres(options: {
  dataDir: string;
  port?: number;
  host?: string;
}): Promise<LocalPostgres> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 5433;
  const dataDir = path.resolve(options.dataDir);
  await mkdir(dataDir, { recursive: true });
  const db = await PGlite.create({ dataDir });
  const server = new PGLiteSocketServer({ db, host, port });
  await server.start();
  const url = `postgres://rakazo:rakazo@${host}:${port}/rakazo`;
  await applySqlMigrations(url);
  return {
    host,
    port,
    url,
    stop: async () => {
      await server.stop();
      await db.close();
    },
  };
}

async function applySqlMigrations(url: string) {
  const migrationsDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prisma/migrations",
  );
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    const applied = new Set(
      (
        await client.query<{ migration_name: string }>(
          "SELECT migration_name FROM _prisma_migrations",
        )
      ).rows.map((row) => row.migration_name),
    );
    const entries = (await readdir(migrationsDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const name of entries) {
      if (applied.has(name)) continue;
      const sql = (await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8")).replace(
        /CREATE INDEX CONCURRENTLY/gi,
        "CREATE INDEX",
      );
      await client.query(sql);
      await client.query(
        `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
         VALUES ($1, $2, now(), $3, 1)`,
        [randomUUID(), createHash("sha256").update(sql).digest("hex"), name],
      );
    }
  } finally {
    await client.end();
  }
}
