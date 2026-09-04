/**
 * Verifies .env.local before we touch the database.
 *
 * Checks shape, not just presence — a pooled URL missing `pgbouncer=true`
 * fails intermittently under load rather than immediately, which is the
 * worst way to find out.
 *
 * Never prints a secret. Values are reported by length and prefix only.
 */

import { readFileSync, existsSync } from "node:fs";

const FILE = ".env.local";

if (!existsSync(FILE)) {
  console.error(`\n  ${FILE} not found. Copy .env.example to .env.local first.\n`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(FILE, "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const eq = line.indexOf("=");
      if (eq === -1) return ["", ""];
      return [
        line.slice(0, eq).trim(),
        line
          .slice(eq + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const problems = [];
const notes = [];

function need(key) {
  const value = env[key];
  if (!value) {
    problems.push(`${key} is empty`);
    return null;
  }
  return value;
}

// ── API ───────────────────────────────────────────────────────────────────
const url = need("NEXT_PUBLIC_SUPABASE_URL");
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url)) {
  problems.push(
    `NEXT_PUBLIC_SUPABASE_URL should look like https://<ref>.supabase.co — got "${url}"`,
  );
}

const anon = need("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const service = need("SUPABASE_SERVICE_ROLE_KEY");

if (anon && service && anon === service) {
  problems.push(
    "The anon key and the service-role key are identical — one of them is pasted in the wrong slot. " +
      "The service-role key bypasses all security and must never be the public one.",
  );
}

// ── Database ──────────────────────────────────────────────────────────────
const pooled = need("DATABASE_URL");
const direct = need("DIRECT_URL");

function checkConnection(key, value, { expectPort, expectPgbouncer }) {
  if (!value) return;
  if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) {
    problems.push(`${key} should start with postgresql://`);
    return;
  }
  if (value.includes("[YOUR-PASSWORD]") || value.includes("YOUR-PASSWORD")) {
    problems.push(
      `${key} still contains the [YOUR-PASSWORD] placeholder — replace it with the database password`,
    );
  }
  if (!value.includes(`:${expectPort}/`)) {
    notes.push(
      `${key} does not use port ${expectPort}. ` +
        (expectPort === 6543
          ? "The pooled string is the one on port 6543."
          : "The direct/session string is the one on port 5432."),
    );
  }
  if (expectPgbouncer && !value.includes("pgbouncer=true")) {
    problems.push(
      `${key} is missing ?pgbouncer=true — without it you get intermittent ` +
        `'prepared statement already exists' errors under concurrency`,
    );
  }
  if (!value.includes("schema=public")) {
    notes.push(`${key} has no schema=public. Recommended, to keep Prisma scoped.`);
  }
}

checkConnection("DATABASE_URL", pooled, {
  expectPort: 6543,
  expectPgbouncer: true,
});
checkConnection("DIRECT_URL", direct, {
  expectPort: 5432,
  expectPgbouncer: false,
});

if (pooled && direct && pooled === direct) {
  problems.push(
    "DATABASE_URL and DIRECT_URL are identical. They are different strings: " +
      "pooled (6543) for the app, direct (5432) for migrations.",
  );
}

// ── Report ────────────────────────────────────────────────────────────────
console.log("");
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
]) {
  const value = env[key];
  const shown = !value
    ? "— empty"
    : key.includes("URL") && !key.includes("SUPABASE_URL")
      ? `set (${value.length} chars, port ${value.match(/:(\d{4})\//)?.[1] ?? "?"})`
      : key === "NEXT_PUBLIC_SUPABASE_URL"
        ? value
        : `set (${value.length} chars, starts ${value.slice(0, 6)}…)`;
  console.log(`  ${value ? "ok " : "   "} ${key.padEnd(32)} ${shown}`);
}

if (notes.length) {
  console.log("\n  Notes:");
  for (const note of notes) console.log(`    - ${note}`);
}

if (problems.length) {
  console.log("\n  Problems:");
  for (const problem of problems) console.log(`    x ${problem}`);
  console.log("\n  See docs/SUPABASE_SETUP.md for where each value lives.\n");
  process.exit(1);
}

console.log("\n  All five values look right. Next:\n");
console.log("    npm run db:migrate\n");
