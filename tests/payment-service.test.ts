import { beforeEach, describe, expect, it } from "vitest";
import {
  getPaymentTransaction,
  processOrderPayment
} from "@/lib/data/payment-service";
import { prismaMock } from "@/tests/setup";

const ownerUser = {
  userId: "user_owner",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

describe("payment service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("fails cleanly if Stripe is not connected for card payment", async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: "company_a",
      stripeConnected: false,
      stripeAccountId: null
    });

    const result = await processOrderPayment({
      user: ownerUser,
      companyId: "company_a",
      orderId: "order_1",
      amount: 20,
      paymentMethod: "card",
      paymentPayload: { paymentToken: "mock_card_token" }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Stripe is not connected for card payments");
    }
  });

  it("rejects invalid payment payload for card payments", async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: "company_a",
      stripeConnected: true,
      stripeAccountId: "acct_demo"
    });

    const result = await processOrderPayment({
      user: ownerUser,
      companyId: "company_a",
      orderId: "order_1",
      amount: 20,
      paymentMethod: "card"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("failed card payments do not mark orders paid", async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: "company_a",
      stripeConnected: true,
      stripeAccountId: "acct_demo"
    });
    prismaMock.paymentTransaction.create.mockResolvedValue({ id: "payment_1" });
    prismaMock.order.update.mockResolvedValue({ id: "order_1", paymentStatus: "failed" });

    const result = await processOrderPayment({
      user: ownerUser,
      companyId: "company_a",
      orderId: "order_1",
      amount: 20,
      paymentMethod: "card",
      paymentPayload: { paymentToken: "fail", simulateFailure: true }
    });

    expect(result.ok).toBe(false);
    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: {
        paymentStatus: "failed",
        paidAt: null
      }
    });
  });

  it("blocks cross-tenant payment access", async () => {
    prismaMock.paymentTransaction.findFirst.mockResolvedValue(null);

    const result = await getPaymentTransaction(ownerUser, "payment_b");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });
});
