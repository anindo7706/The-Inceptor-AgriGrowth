import path from "node:path";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

/*
  Prisma 6 stops auto-loading .env files as soon as this config file exists,
  so we load them here. Node's built-in loader — no dotenv dependency.

  .env.local wins over .env, matching Next.js's own precedence.

  Version note: Prisma 7's CLI is a platform tool with no `generate` or
  `migrate` command, so this project pins Prisma 6 — the stable ORM whose
  commands CLAUDE.md §8 documents. Revisit when v7's ORM story settles.
*/
for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
