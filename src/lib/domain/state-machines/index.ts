/**
 * The five state machines (§47, §29A.6).
 *
 * PLAN.md R-6: §14, §17 and §47 gave contradictory vocabularies. These tables
 * take the union, with UNDER_REVIEW (contract) and REVIEW_REQUIRED (task) as
 * the surviving review names. Every enum member appears as a key, so adding a
 * status without deciding its transitions is a type error, not a runtime
 * surprise.
 */

import { defineMachine } from "./machine";

export { IllegalTransitionError } from "./machine";
export type { StateMachine, TransitionTable } from "./machine";

// ── Land (§12, §47) ───────────────────────────────────────────────────────

export type LandState =
  | "AVAILABLE"
  | "RESERVED"
  | "UNDER_CONTRACT"
  | "UNAVAILABLE";

export const landMachine = defineMachine<LandState>({
  entity: "Land",
  initial: "AVAILABLE",
  table: {
    // Reserved on offer; R-4's expiry job returns it to AVAILABLE.
    AVAILABLE: ["RESERVED", "UNAVAILABLE"],
    RESERVED: ["UNDER_CONTRACT", "AVAILABLE"],
    UNDER_CONTRACT: ["AVAILABLE"],
    // R-17: owner-set, and only from AVAILABLE — a parcel cannot be withdrawn
    // while it is reserved or under contract.
    UNAVAILABLE: ["AVAILABLE"],
  },
});

// ── Contract (§14, §47) ───────────────────────────────────────────────────

export type ContractState =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "OFFERED"
  | "PARTIALLY_ACCEPTED"
  | "AWAITING_BUYER_DECISION"
  | "ACTIVE"
  | "AT_RISK"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED"
  | "DISPUTED";

export const contractMachine = defineMachine<ContractState>({
  entity: "Contract",
  initial: "DRAFT",
  table: {
    DRAFT: ["SUBMITTED", "CANCELLED"],
    // §4's admin validation gate. Dropping UNDER_REVIEW would remove the
    // platform's only check on a bad contract request.
    SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
    UNDER_REVIEW: ["OFFERED", "DECLINED", "CANCELLED"],
    OFFERED: [
      "PARTIALLY_ACCEPTED",
      "ACTIVE",
      "AWAITING_BUYER_DECISION",
      "DECLINED",
      "CANCELLED",
    ],
    // R-5: re-offer rounds run while PARTIALLY_ACCEPTED; when they are
    // exhausted the shortfall escalates to the buyer rather than deadlocking.
    PARTIALLY_ACCEPTED: [
      "ACTIVE",
      "AWAITING_BUYER_DECISION",
      "OFFERED",
      "CANCELLED",
    ],
    AWAITING_BUYER_DECISION: ["ACTIVE", "OFFERED", "CANCELLED"],
    ACTIVE: ["AT_RISK", "COMPLETED", "DISPUTED", "CANCELLED"],
    AT_RISK: ["ACTIVE", "COMPLETED", "DISPUTED", "CANCELLED"],
    // A dispute may be raised after completion — payment is not the end of
    // the platform's responsibility (§45).
    COMPLETED: ["DISPUTED"],
    DISPUTED: ["ACTIVE", "COMPLETED", "CANCELLED"],
    DECLINED: [],
    CANCELLED: [],
  },
});

// ── Task (§17, §47) ───────────────────────────────────────────────────────

export type TaskState =
  | "PENDING"
  | "UPCOMING"
  | "ACTIVE"
  | "SUBMITTED_FOR_REVIEW"
  | "REVIEW_REQUIRED"
  | "COMPLETED"
  | "SKIPPED"
  | "DELAYED"
  | "REJECTED";

export const taskMachine = defineMachine<TaskState>({
  entity: "Task",
  initial: "PENDING",
  table: {
    PENDING: ["UPCOMING", "SKIPPED", "DELAYED"],
    UPCOMING: ["ACTIVE", "SKIPPED", "DELAYED"],
    // Weather may skip or delay work already in progress (§18).
    ACTIVE: ["SUBMITTED_FOR_REVIEW", "SKIPPED", "DELAYED"],
    // R-12: below the completion threshold a task goes to REVIEW_REQUIRED,
    // never straight to COMPLETED.
    SUBMITTED_FOR_REVIEW: ["COMPLETED", "REVIEW_REQUIRED", "REJECTED"],
    REVIEW_REQUIRED: ["COMPLETED", "REJECTED", "ACTIVE"],
    REJECTED: ["ACTIVE"],
    DELAYED: ["ACTIVE", "UPCOMING", "SKIPPED"],
    COMPLETED: [],
    SKIPPED: [],
  },
});

// ── Worker job (§42, §47) ─────────────────────────────────────────────────

export type JobState =
  | "OPEN"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const jobMachine = defineMachine<JobState>({
  entity: "WorkerJob",
  initial: "OPEN",
  table: {
    OPEN: ["PARTIALLY_FILLED", "FILLED", "CANCELLED"],
    // A worker may withdraw, dropping a filled job back to partially filled.
    PARTIALLY_FILLED: ["FILLED", "OPEN", "IN_PROGRESS", "CANCELLED"],
    FILLED: ["IN_PROGRESS", "PARTIALLY_FILLED", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
});

// ── Inspection (§29A) ─────────────────────────────────────────────────────

export type InspectionState =
  | "SCHEDULED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "VERIFIED"
  | "VERIFIED_WITH_OBSERVATIONS"
  | "EVIDENCE_MISMATCH"
  | "REINSPECTION_REQUIRED"
  | "HIGH_RISK"
  | "SUSPECTED_FRAUD"
  | "FAILED";

/**
 * §29A.8: inspection results are append-only. These transitions describe the
 * job's lifecycle — a *correction* to a submitted finding creates a new
 * record and a new audit row, and never rewrites the original.
 */
export const inspectionMachine = defineMachine<InspectionState>({
  entity: "InspectionJob",
  initial: "SCHEDULED",
  table: {
    SCHEDULED: ["ACCEPTED", "REINSPECTION_REQUIRED"],
    ACCEPTED: ["IN_PROGRESS", "REINSPECTION_REQUIRED"],
    IN_PROGRESS: ["SUBMITTED"],
    // Admin review turns a submission into one of the seven outcomes (§29A.6).
    SUBMITTED: [
      "VERIFIED",
      "VERIFIED_WITH_OBSERVATIONS",
      "EVIDENCE_MISMATCH",
      "REINSPECTION_REQUIRED",
      "HIGH_RISK",
      "SUSPECTED_FRAUD",
      "FAILED",
    ],
    // A re-inspection opens a fresh job; this state closes the current one.
    REINSPECTION_REQUIRED: [],
    VERIFIED: [],
    VERIFIED_WITH_OBSERVATIONS: [],
    EVIDENCE_MISMATCH: [],
    HIGH_RISK: [],
    SUSPECTED_FRAUD: [],
    FAILED: [],
  },
});

export const machines = {
  land: landMachine,
  contract: contractMachine,
  task: taskMachine,
  job: jobMachine,
  inspection: inspectionMachine,
} as const;
