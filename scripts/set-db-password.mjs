/**
 * Substitutes the database password into .env.local.
 *
 *   node scripts/set-db-password.mjs "your-database-password"
 *
 * Replaces the [YOUR-PASSWORD] placeholder in DATABASE_URL and DIRECT_URL.
 * Runs locally, so the password never passes through a chat transcript.
 *
 * Never prints the password back. Reports by length only.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = ".env.local";
const password = process.argv[2];

if (!password) {
  console.error(`
  Usage: node scripts/set-db-password.mjs "your-database-password"

  Wrap it in double quotes — passwords often contain characters the shell
  would otherwise interpret.
`);
  process.exit(1);
}

if (!existsSync(FILE)) {
  console.error(`\n  ${FILE} not found.\n`);
  process.exit(1);
}

let content = readFileSync(FILE, "utf8");

const PLACEHOLDER = /\[YOUR-PASSWORD\]/g;
const occurrences = content.match(PLACEHOLDER)?.length ?? 0;

if (occurrences === 0) {
  console.log(`
  No [YOUR-PASSWORD] placeholder found in ${FILE}.

  Either the password is already set, or the connection strings have not
  been pasted in yet. Run "npm run db:check" to see where things stand.
`);
  process.exit(0);
}

/*
  Percent-encode anything that would break the URL's userinfo section.
  A password containing @ or / silently corrupts the host and produces a
  connection error that points nowhere near the real cause.
*/
const encoded = encodeURIComponent(password);

content = content.replace(PLACEHOLDER, encoded);
writeFileSync(FILE, content, "utf8");

console.log(`
  Password written into ${occurrences} connection string${occurrences === 1 ? "" : "s"}.
  (${password.length} characters${encoded !== password ? ", percent-encoded for URL safety" : ""})

  Next:  npm run db:check
`);
