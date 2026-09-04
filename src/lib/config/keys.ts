/**
 * The register of every tunable the PRD describes.
 *
 * CLAUDE.md §4.4: yield factors, worker factors, commission, GPS radius, AI
 * thresholds, financial ranges, inspection triggers — all live in DB config
 * and are read through `src/lib/config`. A magic number in a component is a
 * bug.
 *
 * This file is the single source of truth for what those keys are, what type
 * each holds, what it seeds to, and which PRD section it answers to.
 * `prisma/seed.ts` writes exactly these rows; the admin config screen edits
 * them; nothing else may invent a key.
 *
 * Money is integer paise. Percentages are basis points (10000 = 100%) so
 * they stay integers and never drift through float arithmetic.
 */

export type ConfigType =
  | "INT"
  | "DECIMAL"
  | "BIGINT_PAISE"
  | "BOOLEAN"
  | "STRING"
  | "JSON";

export interface ConfigDefinition {
  readonly type: ConfigType;
  readonly value: string;
  readonly description: string;
  readonly prdSection: string;
}

export const CONFIG_KEYS = {
  // ── Land estimation (§7) ────────────────────────────────────────────────
  LAND_ESTIMATION_BUFFER_BPS: {
    type: "INT",
    value: "1500",
    description:
      "Safety buffer added to required land area, in basis points. 1500 = 15%.",
    prdSection: "§7",
  },
  LAND_ESTIMATION_MIN_PARCEL_ACRES: {
    type: "DECIMAL",
    value: "0.25",
    description: "Smallest parcel area the estimator will propose, in acres.",
    prdSection: "§7",
  },

  // ── Suitability scoring (§9) ────────────────────────────────────────────
  SUITABILITY_WEIGHT_REGION: {
    type: "INT",
    value: "30",
    description: "Points for a suitable crop region. The §9 weights sum to 100.",
    prdSection: "§9",
  },
  SUITABILITY_WEIGHT_SOIL: {
    type: "INT",
    value: "25",
    description: "Points for suitable soil.",
    prdSection: "§9",
  },
  SUITABILITY_WEIGHT_WATER: {
    type: "INT",
    value: "20",
    description: "Points for adequate water availability.",
    prdSection: "§9",
  },
  SUITABILITY_WEIGHT_HISTORY: {
    type: "INT",
    value: "15",
    description: "Points for good historical performance.",
    prdSection: "§9",
  },
  SUITABILITY_WEIGHT_OTHER: {
    type: "INT",
    value: "10",
    description: "Points for remaining factors.",
    prdSection: "§9",
  },
  SUITABILITY_MIN_SCORE_TO_OFFER: {
    type: "INT",
    value: "40",
    description:
      "Parcels scoring below this are excluded from buyer land search.",
    prdSection: "§8, §9",
  },

  // ── Finance (§10, §11) ──────────────────────────────────────────────────
  PLATFORM_COMMISSION_BPS: {
    type: "INT",
    value: "800",
    description: "Platform commission in basis points. 800 = 8%.",
    prdSection: "§11",
  },
  WORKER_BUDGET_BPS: {
    type: "INT",
    value: "3500",
    description: "Share of contract value allocated to the worker budget.",
    prdSection: "§11",
  },
  OPERATIONAL_ALLOCATION_BPS: {
    type: "INT",
    value: "700",
    description: "Share allocated to operational and service costs.",
    prdSection: "§11",
  },
  CONTRACT_PROPOSAL_MIN_PAISE: {
    type: "BIGINT_PAISE",
    value: "50000000",
    description:
      "Floor of the admin-approved proposal range, in paise. 50000000 = Rs 5,00,000.",
    prdSection: "§10",
  },
  CONTRACT_PROPOSAL_MAX_PAISE: {
    type: "BIGINT_PAISE",
    value: "55000000",
    description: "Ceiling of the admin-approved proposal range, in paise.",
    prdSection: "§10",
  },
  WORKER_BUDGET_ALERT_BPS: {
    type: "INT",
    value: "8000",
    description:
      "Worker-budget consumption that raises an admin alert (R-10). 8000 = 80%.",
    prdSection: "§11, R-10",
  },

  // ── Offers and contracts (R-4, R-5) ─────────────────────────────────────
  OFFER_TTL_HOURS: {
    type: "INT",
    value: "72",
    description:
      "Offer lifetime. On expiry the parcel returns to AVAILABLE (R-4) — without this, reserved land locks forever.",
    prdSection: "R-4",
  },
  MAX_REOFFER_ROUNDS: {
    type: "INT",
    value: "2",
    description:
      "Re-offer rounds before a shortfall escalates to AWAITING_BUYER_DECISION (R-5).",
    prdSection: "R-5",
  },
  CONTRACT_FULFILMENT_THRESHOLD_BPS: {
    type: "INT",
    value: "9000",
    description:
      "Accepted production share at which a contract may activate. 9000 = 90%.",
    prdSection: "§14",
  },

  // ── Workforce (§20, §22) ────────────────────────────────────────────────
  WORKER_JOB_ACCEPT_WINDOW_HOURS: {
    type: "INT",
    value: "24",
    description: "How long a worker has to accept an offered job.",
    prdSection: "§21, §22",
  },
  WORKER_MAX_CONCURRENT_JOBS: {
    type: "INT",
    value: "2",
    description: "Concurrent accepted jobs per worker. Guards double-booking.",
    prdSection: "§22",
  },
  WORKER_SEARCH_RADIUS_KM: {
    type: "DECIMAL",
    value: "25",
    description: "Radius for finding eligible workers around a parcel.",
    prdSection: "§21",
  },

  // ── GPS and evidence (§26, R-2, R-12) ───────────────────────────────────
  GPS_BOUNDARY_TOLERANCE_M: {
    type: "INT",
    value: "75",
    description:
      "Tolerance outside the parcel boundary for a VERIFIED check-in (R-2). Point-in-polygon is tried first; a fixed radius from a centroid fails on large parcels.",
    prdSection: "§26, R-2",
  },
  GPS_MAX_ACCURACY_M: {
    type: "INT",
    value: "50",
    description:
      "Worse reported accuracy than this yields LOW_ACCURACY, not TOO_FAR.",
    prdSection: "§26",
  },
  TASK_COMPLETION_THRESHOLD_BPS: {
    type: "INT",
    value: "8000",
    description:
      "Share of assigned workers who must be verified for a task to complete. Below it the task goes to REVIEW_REQUIRED (R-12).",
    prdSection: "R-12",
  },
  EVIDENCE_MAX_UPLOAD_BYTES: {
    type: "INT",
    value: "10485760",
    description: "Per-photo upload ceiling. 10 MiB.",
    prdSection: "§27",
  },

  // ── Weather (§18) ───────────────────────────────────────────────────────
  WEATHER_HEAVY_RAIN_MM_24H: {
    type: "DECIMAL",
    value: "25",
    description: "Rainfall over 24h that marks irrigation unnecessary.",
    prdSection: "§18",
  },
  WEATHER_FORECAST_RAIN_MM_48H: {
    type: "DECIMAL",
    value: "20",
    description: "Forecast rainfall over 48h that delays irrigation.",
    prdSection: "§18",
  },
  WEATHER_CACHE_TTL_MINUTES: {
    type: "INT",
    value: "60",
    description:
      "Weather cache lifetime. The platform must keep working when the provider is down (§32).",
    prdSection: "§18, §32",
  },

  // ── AI (§28, §29) ───────────────────────────────────────────────────────
  AI_CONFIDENCE_HIGH_BPS: {
    type: "INT",
    value: "8500",
    description: "At or above this, an AI result is high confidence. 85%.",
    prdSection: "§29",
  },
  AI_CONFIDENCE_MODERATE_BPS: {
    type: "INT",
    value: "6000",
    description:
      "At or above this, moderate confidence. Below it, request more evidence or manual review.",
    prdSection: "§29",
  },
  AI_ENABLED: {
    type: "BOOLEAN",
    value: "true",
    description:
      "Master switch. With AI off the platform must still function (§32).",
    prdSection: "§32, §44",
  },

  // ── Risk index (R-11, §29A.7) ───────────────────────────────────────────
  RISK_WEIGHT_MISSED_TASKS: {
    type: "INT",
    value: "20",
    description: "Risk-index weight for missed and delayed tasks.",
    prdSection: "R-11",
  },
  RISK_WEIGHT_AI_FLAGS: {
    type: "INT",
    value: "15",
    description: "Weight for AI risk flags.",
    prdSection: "R-11",
  },
  RISK_WEIGHT_WEATHER_STRESS: {
    type: "INT",
    value: "15",
    description: "Weight for accumulated weather stress.",
    prdSection: "R-11",
  },
  RISK_WEIGHT_EVIDENCE_ANOMALY: {
    type: "INT",
    value: "20",
    description: "Weight for evidence anomalies — repeats, gaps, GPS drift.",
    prdSection: "R-11",
  },
  RISK_WEIGHT_INSPECTION: {
    type: "INT",
    value: "0",
    description:
      "Weight for inspection findings. Ships at 0 in Phase 10 and is raised to the HIGHEST weight in Phase 12 — §29A.7 requires inspection to outrank self-submitted photos.",
    prdSection: "R-11, §29A.7",
  },
  RISK_AT_RISK_THRESHOLD: {
    type: "INT",
    value: "60",
    description: "Risk index at which a contract moves to AT_RISK.",
    prdSection: "§14, R-11",
  },

  // ── Inspection triggers (§29A, R-15) ────────────────────────────────────
  INSPECTION_TRIGGER_ON_LOW_AI_CONFIDENCE: {
    type: "BOOLEAN",
    value: "true",
    description:
      "Whether a sub-moderate AI result triggers physical inspection. §29 and §29A each define triggers and neither mentions the other (R-15).",
    prdSection: "R-15",
  },
  INSPECTION_TRIGGER_RISK_THRESHOLD: {
    type: "INT",
    value: "50",
    description: "Risk index that triggers a physical inspection.",
    prdSection: "§29A",
  },
  INSPECTION_MIN_FIELD_AREAS: {
    type: "INT",
    value: "3",
    description:
      "Distinct areas an inspector must photograph. One sample cannot represent a parcel (§29A.4).",
    prdSection: "§29A.4",
  },
} as const satisfies Record<string, ConfigDefinition>;

export type ConfigKey = keyof typeof CONFIG_KEYS;

export const CONFIG_KEY_LIST = Object.keys(CONFIG_KEYS) as ConfigKey[];
