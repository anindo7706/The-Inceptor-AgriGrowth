import { describe, expect, it } from "vitest";
import type { StateMachine } from "./machine";
import {
  contractMachine,
  IllegalTransitionError,
  inspectionMachine,
  jobMachine,
  landMachine,
  machines,
  taskMachine,
} from "./index";

const registry = Object.entries(machines) as [string, StateMachine<string>][];

describe("machine invariants", () => {
  it.each(registry)(
    "%s: every reachable state is a declared key",
    (_name, machine) => {
      const keys = new Set(Object.keys(machine.table));
      for (const [from, targets] of Object.entries(machine.table)) {
        for (const to of targets) {
          expect(keys, `${from} -> ${to} targets an undeclared state`).toContain(
            to,
          );
        }
      }
    },
  );

  it.each(registry)(
    "%s: no state transitions to itself",
    (_name, machine) => {
      for (const [from, targets] of Object.entries(machine.table)) {
        expect(targets, `${from} lists itself`).not.toContain(from);
      }
    },
  );

  it.each(registry)(
    "%s: the initial state is declared and not terminal",
    (_name, machine) => {
      expect(Object.keys(machine.table)).toContain(machine.initial);
      expect(machine.isTerminal(machine.initial)).toBe(false);
    },
  );
});

describe("land (§47, R-17)", () => {
  it("runs the happy path AVAILABLE -> RESERVED -> UNDER_CONTRACT -> AVAILABLE", () => {
    expect(landMachine.can("AVAILABLE", "RESERVED")).toBe(true);
    expect(landMachine.can("RESERVED", "UNDER_CONTRACT")).toBe(true);
    expect(landMachine.can("UNDER_CONTRACT", "AVAILABLE")).toBe(true);
  });

  it("releases a reserved parcel when an offer expires (R-4)", () => {
    expect(landMachine.can("RESERVED", "AVAILABLE")).toBe(true);
  });

  it("refuses to skip reservation", () => {
    expect(landMachine.can("AVAILABLE", "UNDER_CONTRACT")).toBe(false);
  });

  it("refuses withdrawal while reserved or contracted (R-17)", () => {
    expect(landMachine.can("RESERVED", "UNAVAILABLE")).toBe(false);
    expect(landMachine.can("UNDER_CONTRACT", "UNAVAILABLE")).toBe(false);
  });
});

describe("contract (§14 vs §47, R-5, R-6)", () => {
  it("keeps the admin validation gate (§4)", () => {
    expect(contractMachine.can("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    // Submission must not reach landowners without review.
    expect(contractMachine.can("SUBMITTED", "OFFERED")).toBe(false);
  });

  it("gives a partially-accepted contract a way out (R-5)", () => {
    expect(contractMachine.can("PARTIALLY_ACCEPTED", "ACTIVE")).toBe(true);
    expect(
      contractMachine.can("PARTIALLY_ACCEPTED", "AWAITING_BUYER_DECISION"),
    ).toBe(true);
    // Re-offer round.
    expect(contractMachine.can("PARTIALLY_ACCEPTED", "OFFERED")).toBe(true);
  });

  it("allows a dispute after completion", () => {
    expect(contractMachine.can("COMPLETED", "DISPUTED")).toBe(true);
  });

  it("treats DECLINED and CANCELLED as terminal", () => {
    expect(contractMachine.isTerminal("DECLINED")).toBe(true);
    expect(contractMachine.isTerminal("CANCELLED")).toBe(true);
  });

  it("refuses to activate straight from draft", () => {
    expect(contractMachine.can("DRAFT", "ACTIVE")).toBe(false);
  });
});

describe("task (§17 vs §47, R-12)", () => {
  it("never completes without passing through review", () => {
    expect(taskMachine.can("ACTIVE", "COMPLETED")).toBe(false);
    expect(taskMachine.can("SUBMITTED_FOR_REVIEW", "COMPLETED")).toBe(true);
  });

  it("routes a sub-threshold submission to REVIEW_REQUIRED (R-12)", () => {
    expect(taskMachine.can("SUBMITTED_FOR_REVIEW", "REVIEW_REQUIRED")).toBe(
      true,
    );
  });

  it("lets weather skip or delay work in progress (§18)", () => {
    expect(taskMachine.can("ACTIVE", "SKIPPED")).toBe(true);
    expect(taskMachine.can("ACTIVE", "DELAYED")).toBe(true);
    expect(taskMachine.can("DELAYED", "ACTIVE")).toBe(true);
  });

  it("reopens a rejected task", () => {
    expect(taskMachine.can("REJECTED", "ACTIVE")).toBe(true);
  });

  it("treats COMPLETED and SKIPPED as terminal", () => {
    expect(taskMachine.isTerminal("COMPLETED")).toBe(true);
    expect(taskMachine.isTerminal("SKIPPED")).toBe(true);
  });
});

describe("worker job (§42)", () => {
  it("follows OPEN -> PARTIALLY_FILLED -> FILLED -> IN_PROGRESS -> COMPLETED", () => {
    expect(jobMachine.can("OPEN", "PARTIALLY_FILLED")).toBe(true);
    expect(jobMachine.can("PARTIALLY_FILLED", "FILLED")).toBe(true);
    expect(jobMachine.can("FILLED", "IN_PROGRESS")).toBe(true);
    expect(jobMachine.can("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("drops back when a worker withdraws", () => {
    expect(jobMachine.can("FILLED", "PARTIALLY_FILLED")).toBe(true);
    expect(jobMachine.can("PARTIALLY_FILLED", "OPEN")).toBe(true);
  });

  it("refuses to complete a job that never started", () => {
    expect(jobMachine.can("FILLED", "COMPLETED")).toBe(false);
  });
});

describe("inspection (§29A.6, §29A.8)", () => {
  it("reaches all seven outcomes only from SUBMITTED", () => {
    const outcomes = [
      "VERIFIED",
      "VERIFIED_WITH_OBSERVATIONS",
      "EVIDENCE_MISMATCH",
      "REINSPECTION_REQUIRED",
      "HIGH_RISK",
      "SUSPECTED_FRAUD",
      "FAILED",
    ] as const;
    for (const outcome of outcomes) {
      expect(inspectionMachine.can("SUBMITTED", outcome)).toBe(true);
    }
  });

  it("makes every outcome terminal — corrections append, never overwrite", () => {
    // §29A.8. A correction opens a new record; it does not walk this job
    // back out of its outcome.
    expect(inspectionMachine.isTerminal("VERIFIED")).toBe(true);
    expect(inspectionMachine.isTerminal("SUSPECTED_FRAUD")).toBe(true);
    expect(inspectionMachine.isTerminal("FAILED")).toBe(true);
  });

  it("refuses an outcome before the inspector submits", () => {
    expect(inspectionMachine.can("IN_PROGRESS", "VERIFIED")).toBe(false);
    expect(inspectionMachine.can("SCHEDULED", "VERIFIED")).toBe(false);
  });
});

describe("assert()", () => {
  it("passes a legal transition", () => {
    expect(() => landMachine.assert("AVAILABLE", "RESERVED")).not.toThrow();
  });

  it("throws IllegalTransitionError on an illegal one", () => {
    expect(() => contractMachine.assert("DRAFT", "ACTIVE")).toThrow(
      IllegalTransitionError,
    );
  });

  it("names the allowed targets in the message", () => {
    expect(() => taskMachine.assert("ACTIVE", "COMPLETED")).toThrow(
      /Allowed from ACTIVE: SUBMITTED_FOR_REVIEW, SKIPPED, DELAYED/,
    );
  });

  it("says so when the source state is terminal", () => {
    expect(() => jobMachine.assert("COMPLETED", "OPEN")).toThrow(
      /terminal state/,
    );
  });
});
