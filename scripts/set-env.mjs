/**
 * Sets a value in .env.local without opening an editor.
 *
 *   node scripts/set-env.mjs SUPABASE_SERVICE_ROLE_KEY "sb_secret_..."
 *
 * Runs locally, so secrets never pass through a chat transcript.
 * Never prints the value back — reports by length and prefix only.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = ".env.local";
const [key, value] = process.argv.slice(2);

const ALLOWED = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
]);

if (!key || !value) {
  console.error(`
  Usage: node scripts/set-env.mjs <KEY> "<value>"

  Keys: ${[...ALLOWED].join(", ")}
`);
  process.exit(1);
}

if (!ALLOWED.has(key)) {
  console.error(`\n  "${key}" is not one of the known keys.\n  Expected: ${[...ALLOWED].join(", ")}\n`);
  process.exit(1);
}

if (!existsSync(FILE)) {
  console.error(`\n  ${FILE} not found.\n`);
  process.exit(1);
}

/*
  Catch the two swaps that are easy to make and painful to debug: a secret
  key in the publishable slot ships a full-access credential to every
  browser, and a publishable key in the secret slot fails at runtime with an
  authorization error that points nowhere useful.
*/
if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" && value.startsWith("sb_secret_")) {
  console.error(`
  Refusing: that is a SECRET key, and this slot is public — it ships to every
  browser. The publishable key starts "sb_publishable_".
`);
  process.exit(1);
}

if (key === "SUPABASE_SERVICE_ROLE_KEY" && value.startsWith("sb_publishable_")) {
  console.error(`
  Refusing: that is the PUBLISHABLE key. This slot needs the secret key,
  which starts "sb_secret_".
`);
  process.exit(1);
}

const content = readFileSync(FILE, "utf8");
const pattern = new RegExp(`^${key}=.*$`, "m");

if (!pattern.test(content)) {
  console.error(`\n  ${key} not found in ${FILE}.\n`);
  process.exit(1);
}

writeFileSync(FILE, content.replace(pattern, `${key}="${value}"`), "utf8");

console.log(`
  ${key} set (${value.length} chars, starts ${value.slice(0, 14)}…)

  Next:  npm run db:check
`);
