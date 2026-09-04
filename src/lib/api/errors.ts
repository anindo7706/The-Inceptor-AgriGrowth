/**
 * Typed API errors.
 *
 * Every route throws one of these; the route wrapper turns it into a
 * response. Two rules that matter more than they look:
 *
 * 1. `message` reaches the client. Never put a database error, a stack, or
 *    an internal identifier in it.
 * 2. Authorization failures answer 404, not 403, wherever confirming that a
 *    record exists would itself leak something — a landowner probing for
 *    another landowner's contract ids should learn nothing (§35).
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "ILLEGAL_TRANSITION"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE"
  | "INTERNAL";

const STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  ILLEGAL_TRANSITION: 409,
  RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError("BAD_REQUEST", message, details);
  }

  static validation(message: string, details?: unknown) {
    return new ApiError("VALIDATION_FAILED", message, details);
  }

  static unauthenticated(message = "Sign in to continue.") {
    return new ApiError("UNAUTHENTICATED", message);
  }

  static forbidden(message = "You do not have access to this.") {
    return new ApiError("FORBIDDEN", message);
  }

  /** Prefer this over `forbidden` when the id itself is sensitive. */
  static notFound(message = "Not found.") {
    return new ApiError("NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError("CONFLICT", message, details);
  }

  static upstream(service: string) {
    return new ApiError(
      "UPSTREAM_UNAVAILABLE",
      `${service} is unavailable right now. Please try again shortly.`,
    );
  }

  static internal(message = "Something went wrong on our side.") {
    return new ApiError("INTERNAL", message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
