/**
 * Land requirement from ordered quantity (§7).
 *
 * Pure. Config arrives as an argument — no database, no imports from the
 * service layer, fully unit-testable (CLAUDE.md §3).
 *
 * R-8 matters here. This uses `planningYieldPerAcreKg`, which is deliberately
 * conservative and carries the safety buffer. The *forecast* uses a different
 * constant. Using one number for both makes the day-one production forecast
 * equal the ordered quantity exactly — a figure that looks like a prediction
 * and carries no information.
 */

export interface LandEstimationConfig {
  /** Safety buffer in basis points. 1500 = 15%. */
  readonly bufferBps: number;
  /** Smallest parcel area the estimator will propose, in acres. */
  readonly minParcelAcres: number;
}

export interface LandEstimate {
  /** Area needed before the buffer, in acres. */
  readonly baseAcres: number;
  /** Area the buyer should actually contract, buffer included. */
  readonly requiredAcres: number;
  /** The buffer itself, in acres — shown so the number is explicable. */
  readonly bufferAcres: number;
  /** The yield assumption used, so the UI can label it an estimate (§48). */
  readonly planningYieldPerAcreKg: number;
}

export class EstimationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EstimationError";
  }
}

/** Round up to 2 decimal places. Land is contracted in whole parcels, and
 *  rounding *down* would under-provision the order. */
function ceil2(value: number): number {
  return Math.ceil(value * 100) / 100;
}

export function estimateRequiredLand(input: {
  quantityKg: number;
  planningYieldPerAcreKg: number;
  config: LandEstimationConfig;
}): LandEstimate {
  const { quantityKg, planningYieldPerAcreKg, config } = input;

  if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
    throw new EstimationError("Required quantity must be greater than zero.");
  }
  if (!Number.isFinite(planningYieldPerAcreKg) || planningYieldPerAcreKg <= 0) {
    throw new EstimationError(
      "Crop planning yield must be greater than zero — check the crop's configuration.",
    );
  }
  if (config.bufferBps < 0) {
    throw new EstimationError("Buffer cannot be negative.");
  }

  const baseAcres = ceil2(quantityKg / planningYieldPerAcreKg);
  const withBuffer = baseAcres * (1 + config.bufferBps / 10_000);
  const requiredAcres = Math.max(ceil2(withBuffer), config.minParcelAcres);

  return {
    baseAcres,
    requiredAcres,
    bufferAcres: ceil2(requiredAcres - baseAcres),
    planningYieldPerAcreKg,
  };
}

/**
 * Whether a set of selected parcels covers the requirement (§8).
 *
 * The buyer selects parcels against a running total; this is the check
 * behind that total, and the same check the server repeats on submit —
 * client-side arithmetic is UX, never enforcement (CLAUDE.md §4.2).
 */
export function evaluateSelection(input: {
  selectedAcres: readonly number[];
  requiredAcres: number;
}): {
  totalAcres: number;
  shortfallAcres: number;
  surplusAcres: number;
  isSufficient: boolean;
} {
  const { selectedAcres, requiredAcres } = input;

  if (selectedAcres.some((a) => !Number.isFinite(a) || a <= 0)) {
    throw new EstimationError("Every parcel must have a positive area.");
  }

  const totalAcres = ceil2(selectedAcres.reduce((sum, a) => sum + a, 0));
  const difference = ceil2(totalAcres - requiredAcres);

  return {
    totalAcres,
    shortfallAcres: difference < 0 ? Math.abs(difference) : 0,
    surplusAcres: difference > 0 ? difference : 0,
    isSufficient: totalAcres >= requiredAcres,
  };
}

/**
 * Expected production from contracted land (§31).
 *
 * Returns a RANGE, never a point value. §31 and §48 both require estimated
 * production to be distinguishable from guaranteed production, and a single
 * number invites being read as a promise (DESIGN.md §6).
 */
export function forecastProduction(input: {
  acres: number;
  forecastYieldPerAcreKg: number;
  /** Spread either side of the central estimate, in basis points. */
  confidenceSpreadBps: number;
}): { lowKg: number; centralKg: number; highKg: number } {
  const { acres, forecastYieldPerAcreKg, confidenceSpreadBps } = input;

  if (!Number.isFinite(acres) || acres <= 0) {
    throw new EstimationError("Area must be greater than zero.");
  }
  if (confidenceSpreadBps < 0) {
    throw new EstimationError("Confidence spread cannot be negative.");
  }

  const centralKg = Math.round(acres * forecastYieldPerAcreKg);
  const spread = confidenceSpreadBps / 10_000;

  return {
    lowKg: Math.round(centralKg * (1 - spread)),
    centralKg,
    highKg: Math.round(centralKg * (1 + spread)),
  };
}
