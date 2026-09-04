import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError, isApiError } from "./errors";
import { IllegalTransitionError } from "@/lib/domain/state-machines";

/**
 * One response envelope for every route (§34).
 *
 * Success: { ok: true, data }
 * Failure: { ok: false, error: { code, message, details? } }
 *
 * A discriminated union means a client cannot read `data` without first
 * checking `ok`.
 */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; details?: unknown };
    };

/** BigInt is not JSON-serialisable. Money crosses the wire as a string of
 *  paise, and is formatted only at the render edge (CLAUDE.md §4.1). */
function serialise(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serialise);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        serialise(v),
      ]),
    );
  }
  return value;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    { ok: true, data: serialise(data) } satisfies ApiResponse<unknown>,
    init,
  );
}

export function fail(error: ApiError) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    } satisfies ApiResponse<never>,
    { status: error.status },
  );
}

/** Zod issues, flattened into something a form can render field-by-field. */
function fieldErrors(error: ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    (fields[path] ??= []).push(issue.message);
  }
  return fields;
}

/**
 * Wraps a route handler: catches everything, maps it to the envelope, and
 * makes sure an unexpected throw never leaks internals to the client.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isApiError(error)) return fail(error);

      if (error instanceof ZodError) {
        return fail(
          ApiError.validation("Some fields need attention.", fieldErrors(error)),
        );
      }

      // A rejected state transition is a conflict, not a server fault — the
      // caller asked for something the entity's machine forbids (§47).
      if (error instanceof IllegalTransitionError) {
        return fail(
          new ApiError("ILLEGAL_TRANSITION", error.message, {
            entity: error.entity,
            from: error.from,
            to: error.to,
          }),
        );
      }

      // Log the real error server-side; return nothing revealing.
      console.error("[api] unhandled", error);
      return fail(ApiError.internal());
    }
  };
}

/** Parse a request body against a schema, or throw a validation ApiError. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw ApiError.validation(
      "Some fields need attention.",
      fieldErrors(result.error),
    );
  }
  return result.data;
}

/** Parse search params against a schema, or throw a validation ApiError. */
export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) {
    throw ApiError.validation(
      "Some query parameters are invalid.",
      fieldErrors(result.error),
    );
  }
  return result.data;
}
