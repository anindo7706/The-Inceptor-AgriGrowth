import { describe, expect, it } from "vitest";
import {
  estimateRequiredLand,
  evaluateSelection,
  forecastProduction,
  EstimationError,
  type LandEstimationConfig,
} from "./land-estimation";
import {
  allocateContract,
  FinanceError,
  isProposalInRange,
  proRataContractValue,
  splitLandownerPool,
  type FinanceConfig,
} from "./finance";

const ESTIMATION: LandEstimationConfig = {
  bufferBps: 1500,
  minParcelAcres: 0.25,
};

const FINANCE: FinanceConfig = {
  commissionBps: 800,
  workerBudgetBps: 3500,
  operationalBps: 700,
};

describe("land estimation (§7)", () => {
  it("works the PRD's worked example: 100 t of paddy", () => {
    // 100 tonnes = 100,000 kg at 1,600 kg/acre = 62.5 acres, +15% = 71.88.
    const result = estimateRequiredLand({
      quantityKg: 100_000,
      planningYieldPerAcreKg: 1_600,
      config: ESTIMATION,
    });
    expect(result.baseAcres).toBe(62.5);
    expect(result.requiredAcres).toBeCloseTo(71.88, 2);
    expect(result.bufferAcres).toBeCloseTo(9.38, 2);
  });

  it("rounds area up, never down — rounding down under-provisions the order", () => {
    const result = estimateRequiredLand({
      quantityKg: 1_000,
      planningYieldPerAcreKg: 300,
      config: { bufferBps: 0, minParcelAcres: 0 },
    });
    // 3.333... acres must not become 3.33 short of requirement.
    expect(result.baseAcres).toBe(3.34);
  });

  it("never proposes less than the minimum parcel size", () => {
    const result = estimateRequiredLand({
      quantityKg: 1,
      planningYieldPerAcreKg: 5_000,
      config: ESTIMATION,
    });
    expect(result.requiredAcres).toBe(0.25);
  });

  it("reports the yield it assumed, so the UI can label it an estimate", () => {
    const result = estimateRequiredLand({
      quantityKg: 10_000,
      planningYieldPerAcreKg: 1_600,
      config: ESTIMATION,
    });
    expect(result.planningYieldPerAcreKg).toBe(1_600);
  });

  it("rejects a zero or negative quantity", () => {
    expect(() =>
      estimateRequiredLand({
        quantityKg: 0,
        planningYieldPerAcreKg: 1_600,
        config: ESTIMATION,
      }),
    ).toThrow(EstimationError);
  });

  it("rejects a crop with no configured yield rather than dividing by zero", () => {
    expect(() =>
      estimateRequiredLand({
        quantityKg: 100,
        planningYieldPerAcreKg: 0,
        config: ESTIMATION,
      }),
    ).toThrow(/planning yield/i);
  });
});

describe("parcel selection (§8)", () => {
  it("reports a shortfall when the selection is short", () => {
    const r = evaluateSelection({
      selectedAcres: [10, 15],
      requiredAcres: 30,
    });
    expect(r.isSufficient).toBe(false);
    expect(r.shortfallAcres).toBe(5);
    expect(r.surplusAcres).toBe(0);
  });

  it("reports a surplus when the selection overshoots", () => {
    const r = evaluateSelection({
      selectedAcres: [20, 15],
      requiredAcres: 30,
    });
    expect(r.isSufficient).toBe(true);
    expect(r.surplusAcres).toBe(5);
  });

  it("treats an exact match as sufficient", () => {
    const r = evaluateSelection({ selectedAcres: [30], requiredAcres: 30 });
    expect(r.isSufficient).toBe(true);
    expect(r.shortfallAcres).toBe(0);
    expect(r.surplusAcres).toBe(0);
  });

  it("rejects a parcel with no area", () => {
    expect(() =>
      evaluateSelection({ selectedAcres: [10, 0], requiredAcres: 10 }),
    ).toThrow(EstimationError);
  });
});

describe("production forecast (§31, R-8)", () => {
  it("returns a range, never a bare number", () => {
    const f = forecastProduction({
      acres: 10,
      forecastYieldPerAcreKg: 2_000,
      confidenceSpreadBps: 1_500,
    });
    expect(f.centralKg).toBe(20_000);
    expect(f.lowKg).toBe(17_000);
    expect(f.highKg).toBe(23_000);
    expect(f.lowKg).toBeLessThan(f.highKg);
  });

  it("does not reproduce the order quantity exactly (R-8)", () => {
    // The whole point of two yield constants: land is sized on the
    // conservative planning yield, and the forecast uses the higher
    // realistic yield, so the forecast is a genuine second opinion rather
    // than an echo of the order.
    const order = 100_000;
    const planning = 1_600;
    const forecastYield = 1_850;

    const land = estimateRequiredLand({
      quantityKg: order,
      planningYieldPerAcreKg: planning,
      config: ESTIMATION,
    });
    const forecast = forecastProduction({
      acres: land.requiredAcres,
      forecastYieldPerAcreKg: forecastYield,
      confidenceSpreadBps: 1_500,
    });

    expect(forecast.centralKg).not.toBe(order);
    expect(forecast.centralKg).toBeGreaterThan(order);
  });
});

describe("contract allocation (§11)", () => {
  it("splits Rs 10,00,000 into parts that sum exactly to the total", () => {
    const total = 100_000_000n; // Rs 10,00,000 in paise
    const a = allocateContract(total, FINANCE);

    expect(a.commissionPaise).toBe(8_000_000n);
    expect(a.workerBudgetPaise).toBe(35_000_000n);
    expect(a.operationalPaise).toBe(7_000_000n);
    expect(a.landownerPaise).toBe(50_000_000n);

    const sum =
      a.commissionPaise +
      a.workerBudgetPaise +
      a.operationalPaise +
      a.landownerPaise;
    expect(sum).toBe(total);
  });

  it("reconciles exactly even on an awkward total", () => {
    // A value chosen to make every share round.
    const total = 33_333_333n;
    const a = allocateContract(total, FINANCE);
    const sum =
      a.commissionPaise +
      a.workerBudgetPaise +
      a.operationalPaise +
      a.landownerPaise;
    expect(sum).toBe(total);
  });

  it("keeps every amount a BigInt", () => {
    const a = allocateContract(100_000_000n, FINANCE);
    expect(typeof a.commissionPaise).toBe("bigint");
    expect(typeof a.landownerPaise).toBe("bigint");
  });

  it("refuses a split that leaves the landowner nothing", () => {
    expect(() =>
      allocateContract(100_000_000n, {
        commissionBps: 5_000,
        workerBudgetBps: 4_000,
        operationalBps: 1_000,
      }),
    ).toThrow(/nothing for the landowner/);
  });

  it("refuses a zero contract value", () => {
    expect(() => allocateContract(0n, FINANCE)).toThrow(FinanceError);
  });
});

describe("landowner pool split (R-7)", () => {
  it("divides pro-rata by estimated production, not by area", () => {
    const payouts = splitLandownerPool(60_000_000n, [
      { contractLandId: "a", estimatedKg: 10_000 },
      { contractLandId: "b", estimatedKg: 20_000 },
    ]);
    expect(payouts.find((p) => p.contractLandId === "a")?.amountPaise).toBe(
      20_000_000n,
    );
    expect(payouts.find((p) => p.contractLandId === "b")?.amountPaise).toBe(
      40_000_000n,
    );
  });

  it("sums to the pool exactly when the division is not clean", () => {
    // Rs 1,00,000 across three equal parcels: 33,333,333.33 paise each.
    const pool = 10_000_000n;
    const payouts = splitLandownerPool(pool, [
      { contractLandId: "a", estimatedKg: 1 },
      { contractLandId: "b", estimatedKg: 1 },
      { contractLandId: "c", estimatedKg: 1 },
    ]);
    const sum = payouts.reduce((s, p) => s + p.amountPaise, 0n);
    expect(sum).toBe(pool);
  });

  it("loses no paise across many uneven parcels", () => {
    const pool = 99_999_999n;
    const parcels = Array.from({ length: 7 }, (_, i) => ({
      contractLandId: `p${i}`,
      estimatedKg: 1_000 + i * 137,
    }));
    const sum = splitLandownerPool(pool, parcels).reduce(
      (s, p) => s + p.amountPaise,
      0n,
    );
    expect(sum).toBe(pool);
  });

  it("refuses a parcel with no estimated production", () => {
    expect(() =>
      splitLandownerPool(1_000n, [{ contractLandId: "a", estimatedKg: 0 }]),
    ).toThrow(FinanceError);
  });
});

describe("partial acceptance pricing (R-7)", () => {
  it("scales the contract value pro-rata on the shortfall", () => {
    const r = proRataContractValue({
      originalPaise: 100_000_000n,
      requiredKg: 100_000,
      acceptedKg: 70_000,
    });
    expect(r.fulfilmentBps).toBe(7_000);
    expect(r.valuePaise).toBe(70_000_000n);
  });

  it("does not bill the buyer more for surplus land", () => {
    const r = proRataContractValue({
      originalPaise: 100_000_000n,
      requiredKg: 100_000,
      acceptedKg: 130_000,
    });
    expect(r.fulfilmentBps).toBe(10_000);
    expect(r.valuePaise).toBe(100_000_000n);
  });

  it("returns zero when nothing accepted", () => {
    const r = proRataContractValue({
      originalPaise: 100_000_000n,
      requiredKg: 100_000,
      acceptedKg: 0,
    });
    expect(r.valuePaise).toBe(0n);
  });
});

describe("proposal range (§10)", () => {
  it("accepts a proposal inside the admin range", () => {
    expect(isProposalInRange(52_000_000n, 50_000_000n, 55_000_000n)).toBe(true);
  });

  it("accepts the boundaries", () => {
    expect(isProposalInRange(50_000_000n, 50_000_000n, 55_000_000n)).toBe(true);
    expect(isProposalInRange(55_000_000n, 50_000_000n, 55_000_000n)).toBe(true);
  });

  it("rejects a proposal outside it", () => {
    expect(isProposalInRange(49_999_999n, 50_000_000n, 55_000_000n)).toBe(false);
    expect(isProposalInRange(55_000_001n, 50_000_000n, 55_000_000n)).toBe(false);
  });

  it("refuses an inverted range", () => {
    expect(() => isProposalInRange(1n, 100n, 50n)).toThrow(FinanceError);
  });
});
