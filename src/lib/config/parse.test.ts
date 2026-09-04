import { describe, expect, it } from "vitest";
import {
  applyBps,
  bpsToRate,
  ConfigError,
  parseBoolean,
  parseDecimal,
  parseInt_,
  parsePaise,
  PARSERS,
} from "./parse";
import {
  CONFIG_KEYS,
  CONFIG_KEY_LIST,
  type ConfigKey,
  type ConfigType,
} from "./keys";

describe("the config register", () => {
  it("gives every key a description and a PRD section", () => {
    for (const key of CONFIG_KEY_LIST) {
      const def = CONFIG_KEYS[key];
      expect(def.description.length, `${key} has no description`).toBeGreaterThan(
        10,
      );
      expect(def.prdSection, `${key} cites no PRD section`).toBeTruthy();
    }
  });

  it("seeds every default as a parseable value of its declared type", () => {
    for (const key of CONFIG_KEY_LIST) {
      const { type, value } = CONFIG_KEYS[key];
      expect(() => {
        PARSERS[type as ConfigType](key, value);
      }, `${key} default "${value}" is not a valid ${type}`).not.toThrow();
    }
  });

  it("keeps the §9 suitability weights summing to 100", () => {
    const weights: ConfigKey[] = [
      "SUITABILITY_WEIGHT_REGION",
      "SUITABILITY_WEIGHT_SOIL",
      "SUITABILITY_WEIGHT_WATER",
      "SUITABILITY_WEIGHT_HISTORY",
      "SUITABILITY_WEIGHT_OTHER",
    ];
    const total = weights.reduce(
      (sum, key) => sum + parseInt_(key, CONFIG_KEYS[key].value),
      0,
    );
    expect(total).toBe(100);
  });

  it("keeps the §11 allocation shares under 100%", () => {
    // Commission + worker budget + operational must leave something for the
    // landowner, or the split is nonsense.
    const shares: ConfigKey[] = [
      "PLATFORM_COMMISSION_BPS",
      "WORKER_BUDGET_BPS",
      "OPERATIONAL_ALLOCATION_BPS",
    ];
    const total = shares.reduce(
      (sum, key) => sum + parseInt_(key, CONFIG_KEYS[key].value),
      0,
    );
    expect(total).toBeLessThan(10_000);
  });

  it("keeps the proposal range ordered (§10)", () => {
    const min = parsePaise("min", CONFIG_KEYS.CONTRACT_PROPOSAL_MIN_PAISE.value);
    const max = parsePaise("max", CONFIG_KEYS.CONTRACT_PROPOSAL_MAX_PAISE.value);
    expect(max).toBeGreaterThan(min);
  });

  it("keeps the AI confidence bands ordered (§29)", () => {
    const high = parseInt_("high", CONFIG_KEYS.AI_CONFIDENCE_HIGH_BPS.value);
    const moderate = parseInt_(
      "moderate",
      CONFIG_KEYS.AI_CONFIDENCE_MODERATE_BPS.value,
    );
    expect(high).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(0);
  });

  it("ships the inspection risk weight at zero until Phase 12 (R-11)", () => {
    // §29A.7 requires inspection to outrank self-submitted photos. Until
    // Phase 12 there are no inspections, so the weight must not skew the
    // index — it is raised to the highest weight when inspection lands.
    expect(parseInt_("w", CONFIG_KEYS.RISK_WEIGHT_INSPECTION.value)).toBe(0);
  });
});

describe("parsers reject rather than coerce", () => {
  it("refuses a non-integer where an integer is declared", () => {
    expect(() => parseInt_("K", "8.5")).toThrow(ConfigError);
    expect(() => parseInt_("K", "")).toThrow(ConfigError);
    expect(() => parseInt_("K", "eight")).toThrow(ConfigError);
  });

  it("refuses a non-number decimal", () => {
    expect(() => parseDecimal("K", "abc")).toThrow(ConfigError);
    expect(() => parseDecimal("K", "")).toThrow(ConfigError);
  });

  it("refuses fractional paise — money is integer paise", () => {
    expect(() => parsePaise("K", "100.5")).toThrow(ConfigError);
  });

  it("parses paise as BigInt, never Number", () => {
    const v = parsePaise("K", "50000000");
    expect(typeof v).toBe("bigint");
    expect(v).toBe(50_000_000n);
  });

  it("survives amounts beyond Number.MAX_SAFE_INTEGER", () => {
    // Rs 1,00,00,00,00,000 in paise comfortably exceeds 2^53.
    const huge = "1000000000000000000";
    expect(parsePaise("K", huge)).toBe(1_000_000_000_000_000_000n);
  });

  it("accepts only true and false for booleans", () => {
    expect(parseBoolean("K", "true")).toBe(true);
    expect(parseBoolean("K", "FALSE")).toBe(false);
    expect(() => parseBoolean("K", "1")).toThrow(ConfigError);
    expect(() => parseBoolean("K", "yes")).toThrow(ConfigError);
  });

  it("names the key in the error", () => {
    expect(() => parseInt_("PLATFORM_COMMISSION_BPS", "x")).toThrow(
      /PLATFORM_COMMISSION_BPS/,
    );
  });
});

describe("basis-point money arithmetic", () => {
  it("converts bps to a rate", () => {
    expect(bpsToRate(800)).toBeCloseTo(0.08);
    expect(bpsToRate(10_000)).toBe(1);
  });

  it("applies a rate to paise entirely in BigInt", () => {
    // 8% commission on Rs 10,00,000 = Rs 80,000.
    expect(applyBps(100_000_000n, 800)).toBe(8_000_000n);
  });

  it("rounds half away from zero rather than truncating", () => {
    // 1 paisa at 50% is exactly half a paisa.
    expect(applyBps(1n, 5_000)).toBe(1n);
    // 3 paise at 8.33% rounds down.
    expect(applyBps(3n, 833)).toBe(0n);
  });

  it("never loses precision on large contract values", () => {
    // Rs 5,50,000 = 55,000,000 paise; 8% is exactly 4,400,000.
    expect(applyBps(55_000_000n, 800)).toBe(4_400_000n);
  });

  it("leaves the amount unchanged at 100%", () => {
    expect(applyBps(123_456_789n, 10_000)).toBe(123_456_789n);
  });

  it("rejects a non-integer bps", () => {
    expect(() => applyBps(100n, 8.5)).toThrow(RangeError);
  });
});
