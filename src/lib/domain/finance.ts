/**
 * Contract money (§10, §11, R-7).
 *
 * Every amount is integer paise in BigInt. Never a float, never a Number
 * (CLAUDE.md §4.1). Percentages arrive as basis points so they stay integers.
 *
 * §11 gives the split only by example and leaves the multi-parcel case
 * undefined; R-7 settles it — the landowner pool divides pro-rata by each
 * parcel's estimated production, not by area, because a fertile acre and a
 * poor acre do not contribute equally to the order.
 */

import { applyBps } from "@/lib/config/parse";

export interface FinanceConfig {
  readonly commissionBps: number;
  readonly workerBudgetBps: number;
  readonly operationalBps: number;
}

export interface ContractAllocation {
  readonly totalPaise: bigint;
  readonly commissionPaise: bigint;
  readonly workerBudgetPaise: bigint;
  readonly operationalPaise: bigint;
  /** Whatever remains. Computed by subtraction so the parts always sum to
   *  the total exactly — no rounding dust escapes. */
  readonly landownerPaise: bigint;
}

export class FinanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceError";
  }
}

export function allocateContract(
  totalPaise: bigint,
  config: FinanceConfig,
): ContractAllocation {
  if (totalPaise <= 0n) {
    throw new FinanceError("Contract value must be greater than zero.");
  }

  const shareTotal =
    config.commissionBps + config.workerBudgetBps + config.operationalBps;
  if (shareTotal >= 10_000) {
    throw new FinanceError(
      `Allocation shares total ${shareTotal} bps, leaving nothing for the landowner.`,
    );
  }

  const commissionPaise = applyBps(totalPaise, config.commissionBps);
  const workerBudgetPaise = applyBps(totalPaise, config.workerBudgetBps);
  const operationalPaise = applyBps(totalPaise, config.operationalBps);

  // Subtraction, not a fourth percentage. Three rounded shares plus a fourth
  // rounded share would not reliably sum to the total, and a contract whose
  // parts do not reconcile is a correctness bug.
  const landownerPaise =
    totalPaise - commissionPaise - workerBudgetPaise - operationalPaise;

  return {
    totalPaise,
    commissionPaise,
    workerBudgetPaise,
    operationalPaise,
    landownerPaise,
  };
}

export interface ParcelShare {
  readonly contractLandId: string;
  /** Estimated production from this parcel, in kg. */
  readonly estimatedKg: number;
}

export interface ParcelPayout {
  readonly contractLandId: string;
  readonly amountPaise: bigint;
}

/**
 * Divide the landowner pool across parcels, pro-rata by estimated production
 * (R-7).
 *
 * The largest-remainder method: every payout is a whole number of paise, and
 * the payouts sum to the pool exactly. Naive rounding would leave orphaned
 * paise that reconcile against nothing.
 */
export function splitLandownerPool(
  poolPaise: bigint,
  parcels: readonly ParcelShare[],
): ParcelPayout[] {
  if (parcels.length === 0) {
    throw new FinanceError("Cannot split a pool across zero parcels.");
  }
  if (poolPaise < 0n) {
    throw new FinanceError("Pool cannot be negative.");
  }
  if (parcels.some((p) => p.estimatedKg <= 0)) {
    throw new FinanceError("Every parcel must have positive estimated production.");
  }

  const totalKg = parcels.reduce((sum, p) => sum + p.estimatedKg, 0);

  // Work in scaled integers: kg may be fractional, paise may not.
  const SCALE = 1_000_000n;
  const scaledTotal = BigInt(Math.round(totalKg * 1_000_000));

  const provisional = parcels.map((parcel) => {
    const scaledKg = BigInt(Math.round(parcel.estimatedKg * 1_000_000));
    const exact = (poolPaise * scaledKg) / scaledTotal;
    const remainder = (poolPaise * scaledKg) % scaledTotal;
    return { parcel, floor: exact, remainder };
  });

  const distributed = provisional.reduce((sum, p) => sum + p.floor, 0n);
  let leftover = poolPaise - distributed;

  // Largest remainder first takes the spare paise.
  const order = [...provisional].sort((a, b) =>
    a.remainder === b.remainder ? 0 : a.remainder > b.remainder ? -1 : 1,
  );
  const bonus = new Map<string, bigint>();
  for (const entry of order) {
    if (leftover <= 0n) break;
    bonus.set(entry.parcel.contractLandId, 1n);
    leftover -= 1n;
  }
  void SCALE;

  return provisional.map(({ parcel, floor }) => ({
    contractLandId: parcel.contractLandId,
    amountPaise: floor + (bonus.get(parcel.contractLandId) ?? 0n),
  }));
}

/**
 * Scale a contract's value when only part of the land accepts (R-7).
 *
 * §14 tracks the shortfall but §11 never says the money changes. It must —
 * and never silently: the caller is responsible for putting the reduced
 * figure in front of the buyer for confirmation before activation.
 */
export function proRataContractValue(input: {
  originalPaise: bigint;
  requiredKg: number;
  acceptedKg: number;
}): { valuePaise: bigint; fulfilmentBps: number } {
  const { originalPaise, requiredKg, acceptedKg } = input;

  if (requiredKg <= 0) {
    throw new FinanceError("Required production must be greater than zero.");
  }
  if (acceptedKg < 0) {
    throw new FinanceError("Accepted production cannot be negative.");
  }

  // Capped at 100%: surplus land does not earn the buyer a larger bill.
  const ratio = Math.min(acceptedKg / requiredKg, 1);
  const fulfilmentBps = Math.round(ratio * 10_000);

  return {
    valuePaise: applyBps(originalPaise, fulfilmentBps),
    fulfilmentBps,
  };
}

/** Whether a proposal sits inside the admin-approved range (§10). */
export function isProposalInRange(
  proposalPaise: bigint,
  minPaise: bigint,
  maxPaise: bigint,
): boolean {
  if (minPaise > maxPaise) {
    throw new FinanceError("Proposal range is inverted.");
  }
  return proposalPaise >= minPaise && proposalPaise <= maxPaise;
}
