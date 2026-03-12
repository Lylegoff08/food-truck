import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateWeeklyRevenueForCompany } from "@/lib/data/billing-service";
import { logAuditEvent } from "@/lib/data/audit-service";
import { ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

function ensureSuperAdmin(user: SessionUser): AuthResult<true> {
  return ensureRole(user, [UserRole.super_admin]);
}

export async function listPlatformCompanies(user: SessionUser) {
  const roleCheck = ensureSuperAdmin(user);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          trucks: true,
          employees: true,
          orders: true
        }
      },
      weeklyRevenue: {
        orderBy: { weekStart: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return ok(companies);
}

export async function getPlatformSummary(user: SessionUser) {
  const companiesResult = await listPlatformCompanies(user);
  if (!companiesResult.ok) {
    return companiesResult;
  }

  const weeklySummaries = await Promise.all(
    companiesResult.data.map((company) => calculateWeeklyRevenueForCompany(company.id, user.userId))
  );

  return ok({
    companyCount: companiesResult.data.length,
    companies: companiesResult.data,
    weeklySummaries
  });
}

export async function setCompanySuspension(
  user: SessionUser,
  companyId: string,
  suspended: boolean
) {
  const roleCheck = ensureSuperAdmin(user);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    return fail("Company not found", 404);
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { suspended }
  });

  await logAuditEvent({
    companyId,
    actorUserId: user.userId,
    action: suspended ? "platform.company_suspend" : "platform.company_unsuspend",
    entityType: "Company",
    entityId: companyId,
    details: {
      companyName: company.name,
      suspended
    } satisfies Prisma.InputJsonValue
  });

  return ok(updated);
}
