import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { decimal, ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AddPayRateInput, AuthResult, SessionUser } from "@/lib/types";

export async function addPayRate(
  user: SessionUser,
  input: AddPayRateInput
): Promise<AuthResult<{ id: string }>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, companyId: user.companyId }
  });

  if (!employee) {
    return fail("Employee not found", 404);
  }

  if (Number.isNaN(input.hourlyRate) || input.hourlyRate < 0) {
    return fail("Hourly rate must be zero or greater");
  }

  const payRate = await prisma.payRate.create({
    data: {
      companyId: user.companyId,
      employeeId: input.employeeId,
      hourlyRate: decimal(input.hourlyRate),
      effectiveDate: input.effectiveDate
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "pay_rate.add",
    entityType: "PayRate",
    entityId: payRate.id,
    details: {
      employeeId: input.employeeId,
      hourlyRate: input.hourlyRate,
      effectiveDate: input.effectiveDate.toISOString()
    }
  });

  return ok({ id: payRate.id });
}

export async function listPayRateHistory(user: SessionUser, employeeId: string) {
  return prisma.payRate.findMany({
    where: {
      companyId: user.companyId,
      employeeId
    },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }]
  });
}

export async function getCurrentPayRate(user: SessionUser, employeeId: string) {
  return prisma.payRate.findFirst({
    where: {
      companyId: user.companyId,
      employeeId,
      effectiveDate: {
        lte: new Date()
      }
    },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }]
  });
}
