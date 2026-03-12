import { Prisma, UserRole } from "@prisma/client";
import type { AuthResult, SessionUser } from "@/lib/types";

export function ensureRole(user: SessionUser, allowed: UserRole[]): AuthResult<true> {
  if (!allowed.includes(user.role)) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return { ok: true, data: true };
}

export function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export function ok<T>(data: T): AuthResult<T> {
  return { ok: true, data };
}

export function fail(message: string, status = 400): AuthResult<never> {
  return { ok: false, error: message, status };
}
