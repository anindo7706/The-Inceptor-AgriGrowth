import path from "node:path";
import { defineConfig } from "prisma/config";

/*
  Prisma config lives here rather than in package.json, which Prisma 6
  deprecates.

  Note on versions: Prisma 7's CLI is a platform tool with no `generate` or
  `migrate` commands, so this project pins Prisma 6 — the stable ORM whose
  commands CLAUDE.md §8 documents. Revisit when v7's ORM story settles.
*/
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
