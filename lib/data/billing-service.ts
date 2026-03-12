import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { decimal, ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";
import { paymentGateway } from "@/lib/payments";

const BILLING_THRESHOLD = 499;
const PLATFORM_FEE_RATE = 0.03;

function getWeekStart(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
}

export async function getBillingStatus(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId }
  });

  if (!company) {
    return fail("Company not found", 404);
  }

  return ok(company);
}

export async function startStripeConnectFlow(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId }
  });

  if (!company) {
    return fail("Company not found", 404);
  }

  const link = await paymentGateway.createOnboardingLink(company.slug);

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "stripe.connect_start",
    entityType: "Company",
    entityId: user.companyId,
    details: {
      suggestedAccountId: link.suggestedAccountId
    } satisfies Prisma.InputJsonValue
  });

  return ok(link);
}

export async function saveStripeAccountMetadata(
  user: SessionUser,
  input: {
    stripeAccountId: string;
    stripeConnectionStatus: string;
  }
): Promise<AuthResult<{ id: string }>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  if (!input.stripeAccountId.trim()) {
    return fail("stripeAccountId is required");
  }

  const company = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      stripeAccountId: input.stripeAccountId.trim(),
      stripeConnected: true,
      stripeConnectionStatus: input.stripeConnectionStatus.trim() || "connected"
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "stripe.connect_save",
    entityType: "Company",
    entityId: company.id,
    details: {
      stripeAccountId: company.stripeAccountId,
      stripeConnectionStatus: company.stripeConnectionStatus
    } satisfies Prisma.InputJsonValue
  });

  return ok({ id: company.id });
}

export async function disconnectStripeAccount(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const successfulCardTransactions = await prisma.paymentTransaction.count({
    where: {
      companyId: user.companyId,
      provider: "stripe_connect_mock",
      status: "succeeded"
    }
  });

  if (successfulCardTransactions > 0) {
    return fail("Disconnect blocked after successful card payments", 400);
  }

  const company = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      stripeAccountId: null,
      stripeConnected: false,
      stripeConnectionStatus: "disconnected"
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "stripe.disconnect",
    entityType: "Company",
    entityId: company.id
  });

  return ok({ id: company.id });
}

export async function calculateWeeklyRevenueForCompany(
  companyId: string,
  actorUserId?: string | null,
  weekStart = getWeekStart()
) {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const orders = await prisma.order.findMany({
    where: {
      companyId,
      paymentStatus: "paid",
      paidAt: {
        gte: weekStart,
        lt: weekEnd
      }
    },
    select: {
      subtotal: true
    }
  });

  const grossSales = Number(
    orders.reduce((sum, order) => sum + Number(order.subtotal), 0).toFixed(2)
  );
  const thresholdMet = grossSales > BILLING_THRESHOLD;
  const platformFeeDue = thresholdMet
    ? Number((grossSales * PLATFORM_FEE_RATE).toFixed(2))
    : 0;

  const summary = await prisma.companyWeeklyRevenue.upsert({
    where: {
      companyId_weekStart: {
        companyId,
        weekStart
      }
    },
    update: {
      grossSales: decimal(grossSales),
      thresholdMet,
      platformFeeDue: decimal(platformFeeDue),
      calculatedAt: new Date()
    },
    create: {
      companyId,
      weekStart,
      grossSales: decimal(grossSales),
      thresholdMet,
      platformFeeDue: decimal(platformFeeDue)
    }
  });

  await logAuditEvent({
    companyId,
    actorUserId: actorUserId ?? null,
    action: "billing.weekly_revenue_calculated",
    entityType: "CompanyWeeklyRevenue",
    entityId: summary.id,
    details: {
      grossSales,
      thresholdMet,
      platformFeeDue
    } satisfies Prisma.InputJsonValue
  });

  return summary;
}

export async function getWeeklyRevenueSummary(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const currentWeek = await calculateWeeklyRevenueForCompany(user.companyId, user.userId);
  const history = await prisma.companyWeeklyRevenue.findMany({
    where: { companyId: user.companyId },
    orderBy: { weekStart: "desc" },
    take: 12
  });

  return ok({ currentWeek, history });
}

export { BILLING_THRESHOLD, PLATFORM_FEE_RATE, getWeekStart };
