import {
  Prisma,
  UserRole
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { paymentGateway } from "@/lib/payments";
import { decimal, ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

export async function listPaymentTransactions(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  return ok(
    await prisma.paymentTransaction.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" }
    })
  );
}

export async function getPaymentTransaction(user: SessionUser, paymentId: string) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      id: paymentId,
      companyId: user.companyId
    }
  });

  if (!transaction) {
    return fail("Payment transaction not found", 404);
  }

  return ok(transaction);
}

export async function processOrderPayment(input: {
  user: SessionUser;
  companyId: string;
  orderId: string;
  amount: number;
  paymentMethod: "cash" | "card";
  paymentPayload?: {
    paymentToken?: string | null;
    simulateFailure?: boolean;
  };
}): Promise<
  AuthResult<{
    paymentStatus: "paid" | "failed";
    paymentTransactionId: string;
  }>
> {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId }
  });

  if (!company) {
    return fail("Company not found", 404);
  }

  if (input.paymentMethod === "cash") {
    const transaction = await prisma.paymentTransaction.create({
      data: {
        companyId: input.companyId,
        orderId: input.orderId,
        provider: "manual_cash",
        amount: decimal(input.amount),
        status: "succeeded",
        rawResponse: { note: "Marked paid as cash" }
      }
    });

    await prisma.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: "paid",
        paidAt: new Date()
      }
    });

    await logAuditEvent({
      companyId: input.companyId,
      actorUserId: input.user.userId,
      action: "payment.cash_success",
      entityType: "PaymentTransaction",
      entityId: transaction.id
    });

    return ok({
      paymentStatus: "paid",
      paymentTransactionId: transaction.id
    });
  }

  if (!company.stripeConnected || !company.stripeAccountId) {
    return fail("Stripe is not connected for card payments", 400);
  }

  if (!input.paymentPayload) {
    return fail("Card payment payload is required", 400);
  }

  const gatewayResult = await paymentGateway.charge({
    connectedAccountId: company.stripeAccountId,
    amount: input.amount,
    paymentToken: input.paymentPayload.paymentToken,
    simulateFailure: input.paymentPayload.simulateFailure
  });

  const transaction = await prisma.paymentTransaction.create({
    data: {
      companyId: input.companyId,
      orderId: input.orderId,
      provider: "stripe_connect_mock",
      providerTransactionId: gatewayResult.providerTransactionId,
      amount: decimal(input.amount),
      status: gatewayResult.status,
      rawResponse: gatewayResult.rawResponse as Prisma.InputJsonValue
    }
  });

  if (gatewayResult.success) {
    await prisma.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: "paid",
        paidAt: new Date()
      }
    });

    await logAuditEvent({
      companyId: input.companyId,
      actorUserId: input.user.userId,
      action: "payment.card_success",
      entityType: "PaymentTransaction",
      entityId: transaction.id,
      details: {
        providerTransactionId: gatewayResult.providerTransactionId
      } satisfies Prisma.InputJsonValue
    });

    return ok({
      paymentStatus: "paid",
      paymentTransactionId: transaction.id
    });
  }

  await prisma.order.update({
    where: { id: input.orderId },
    data: {
      paymentStatus: "failed",
      paidAt: null
    }
  });

  await logAuditEvent({
    companyId: input.companyId,
    actorUserId: input.user.userId,
    action: "payment.card_failure",
    entityType: "PaymentTransaction",
    entityId: transaction.id,
    details: gatewayResult.rawResponse as Prisma.InputJsonValue
  });

  return fail("Card payment failed", 402);
}
