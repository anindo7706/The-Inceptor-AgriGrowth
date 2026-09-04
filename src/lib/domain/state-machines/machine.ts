/**
 * Guarded state machines (§47, PLAN.md R-6).
 *
 * CLAUDE.md §4.5: status changes go through the entity's machine, never a
 * raw `update({ status })`. Illegal transitions throw rather than silently
 * writing a state nothing downstream expects.
 *
 * Pure — no I/O, no database. The service layer pairs `assertTransition`
 * with the write and the AuditLog row inside one transaction.
 */

export class IllegalTransitionError extends Error {
  readonly entity: string;
  readonly from: string;
  readonly to: string;

  constructor(entity: string, from: string, to: string) {
    super(
      `Illegal ${entity} transition: ${from} → ${to}. ` +
        `Allowed from ${from}: ${describeAllowed(entity, from)}.`,
    );
    this.name = "IllegalTransitionError";
    this.entity = entity;
    this.from = from;
    this.to = to;
  }
}

/** A transition table: for each state, the states reachable from it. */
export type TransitionTable<S extends string> = Readonly<
  Record<S, readonly S[]>
>;

export interface StateMachine<S extends string> {
  readonly entity: string;
  readonly initial: S;
  readonly table: TransitionTable<S>;
  /** States with no outbound transitions. */
  readonly terminal: readonly S[];
  can(from: S, to: S): boolean;
  assert(from: S, to: S): void;
  next(from: S): readonly S[];
  isTerminal(state: S): boolean;
}

const REGISTRY = new Map<string, TransitionTable<string>>();

function describeAllowed(entity: string, from: string): string {
  const table = REGISTRY.get(entity);
  const allowed = table?.[from];
  if (!allowed || allowed.length === 0) return "nothing (terminal state)";
  return allowed.join(", ");
}

export function defineMachine<S extends string>(config: {
  entity: string;
  initial: S;
  table: TransitionTable<S>;
}): StateMachine<S> {
  const { entity, initial, table } = config;
  REGISTRY.set(entity, table as TransitionTable<string>);

  const terminal = (Object.keys(table) as S[]).filter(
    (state) => table[state].length === 0,
  );

  return {
    entity,
    initial,
    table,
    terminal,
    can: (from, to) => table[from]?.includes(to) ?? false,
    assert(from, to) {
      if (!this.can(from, to)) {
        throw new IllegalTransitionError(entity, from, to);
      }
    },
    next: (from) => table[from] ?? [],
    isTerminal: (state) => (table[state]?.length ?? 0) === 0,
  };
}
