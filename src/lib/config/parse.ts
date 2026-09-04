/**
 * Parsers for config values.
 *
 * Values are stored as strings so one table holds every type. These readers
 * are the only place that string becomes a number — and they throw rather
 * than coerce, because a silently-NaN commission rate is worse than a crash.
 *
 * Pure: no database, fully unit-testable.
 */

import { CONFIG_KEYS, type ConfigKey, type ConfigType } from "./keys";

export class ConfigError extends Error {
  constructor(key: string, message: string) {
    super(`Config "${key}": ${message}`);
    this.name = "ConfigError";
  }
}

export function parseInt_(key: string, raw: string): number {
  if (!/^-?\d+$/.test(raw.trim())) {
    throw new ConfigError(key, `expected an integer, got "${raw}"`);
  }
  const n = Number(raw);
  if (!Number.isSafeInteger(n)) {
    throw new ConfigError(key, `integer out of safe range: "${raw}"`);
  }
  return n;
}

export function parseDecimal(key: string, raw: string): number {
  const n = Number(raw.trim());
  if (raw.trim() === "" || Number.isNaN(n) || !Number.isFinite(n)) {
    throw new ConfigError(key, `expected a number, got "${raw}"`);
  }
  return n;
}

/** Money never becomes a Number. Paise in, BigInt out (CLAUDE.md §4.1). */
export function parsePaise(key: string, raw: string): bigint {
  if (!/^-?\d+$/.test(raw.trim())) {
    throw new ConfigError(key, `expected integer paise, got "${raw}"`);
  }
  return BigInt(raw.trim());
}

export function parseBoolean(key: string, raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  throw new ConfigError(key, `expected "true" or "false", got "${raw}"`);
}

export function parseJson<T>(key: string, raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ConfigError(key, "value is not valid JSON");
  }
}

/** Basis points to a multiplier: 800 -> 0.08. Percentages stay integers in
 *  storage so they never drift through float arithmetic. */
export function bpsToRate(bps: number): number {
  return bps / 10_000;
}

/**
 * Apply a basis-point rate to an integer-paise amount, staying in BigInt the
 * whole way. Rounds half-up on the final division so allocations do not
 * silently lose paise.
 */
export function applyBps(amountPaise: bigint, bps: number): bigint {
  if (!Number.isSafeInteger(bps)) {
    throw new RangeError(`bps must be an integer, got ${bps}`);
  }
  const numerator = amountPaise * BigInt(bps);
  const denominator = 10_000n;
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  // Round half away from zero.
  const shouldRoundUp = remainder * 2n >= denominator;
  const shouldRoundDown = remainder * 2n <= -denominator;
  if (shouldRoundUp) return quotient + 1n;
  if (shouldRoundDown) return quotient - 1n;
  return quotient;
}

/**
 * Parser per declared type. Keyed by ConfigType so adding a type to the
 * union without a parser is a compile error, and so the seed and the admin
 * config screen validate through exactly the same code as the readers.
 */
export const PARSERS: Record<
  ConfigType,
  (key: string, raw: string) => unknown
> = {
  INT: parseInt_,
  DECIMAL: parseDecimal,
  BIGINT_PAISE: parsePaise,
  BOOLEAN: parseBoolean,
  STRING: (_key, raw) => raw,
  JSON: parseJson,
};

/** The seeded default for a key, parsed. Used by tests and as the fallback
 *  when a config row is missing. */
export function defaultValue(key: ConfigKey): string {
  return CONFIG_KEYS[key].value;
}
