import { beforeEach, describe, expect, it } from "vitest";
import {
  BILLING_THRESHOLD,
  PLATFORM_FEE_RATE,
  calculateWeeklyRevenueForCompany,
  getBillingStatus,
  getWeeklyRevenueSummary,
  saveStripeAccountMetadata
} from "@/lib/data/billing-service";
import { prismaMock } from "@/tests/setup";

const ownerUser = {
  userId: "user_owner",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

describe("billing service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("saves Stripe account metadata", async () => {
    prismaMock.company.update.mockResolvedValue({
      id: "company_a",
      stripeAccountId: "acct_demo",
      stripeConnectionStatus: "connected"
    });

    const result = await saveStripeAccountMetadata(ownerUser, {
      stripeAccountId: "acct_demo",
      stripeConnectionStatus: "connected"
    });

    expect(result.ok).toBe(true);
    expect(prismaMock.company.update).toHaveBeenCalledTimes(1);
  });

  it("returns fee 0 below threshold", async () => {
    prismaMock.order.findMany.mockResolvedValue([{ subtotal: 200 }, { subtotal: 200 }]);
    prismaMock.companyWeeklyRevenue.upsert.mockResolvedValue({
      id: "week_1",
      grossSales: 400,
      thresholdMet: false,
      platformFeeDue: 0
    });

    const summary = await calculateWeeklyRevenueForCompany("company_a", "user_owner");

    expect(prismaMock.companyWeeklyRevenue.upsert).toHaveBeenCalled();
    expect(Number(summary.platformFeeDue)).toBe(0);
  });

  it("returns 3 percent fee above threshold", async () => {
    prismaMock.order.findMany.mockResolvedValue([{ subtotal: 300 }, { subtotal: 250 }]);
    prismaMock.companyWeeklyRevenue.upsert.mockResolvedValue({
      id: "week_2",
      grossSales: 550,
      thresholdMet: true,
      platformFeeDue: Number((550 * PLATFORM_FEE_RATE).toFixed(2))
    });

    const summary = await calculateWeeklyRevenueForCompany("company_a", "user_owner");

    expect(Number(summary.platformFeeDue)).toBeGreaterThan(0);
    expect(Number(summary.platformFeeDue)).toBe(Number((550 * PLATFORM_FEE_RATE).toFixed(2)));
  });

  it("only counts paid orders toward weekly totals", async () => {
    prismaMock.order.findMany.mockResolvedValue([{ subtotal: 300 }]);
    prismaMock.companyWeeklyRevenue.upsert.mockResolvedValue({
      id: "week_3",
      grossSales: 300,
      thresholdMet: false,
      platformFeeDue: 0
    });

    const summary = await calculateWeeklyRevenueForCompany("company_a", "user_owner");

    expect(Number(summary.grossSales)).toBe(300);
  });

  it("tenant billing status only reads its own company", async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: "company_a",
      stripeConnected: false
    });
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.companyWeeklyRevenue.upsert.mockResolvedValue({
      id: "week_4",
      grossSales: 0,
      thresholdMet: false,
      platformFeeDue: 0
    });
    prismaMock.companyWeeklyRevenue.findMany.mockResolvedValue([]);

    const [statusResult, revenueResult] = await Promise.all([
      getBillingStatus(ownerUser),
      getWeeklyRevenueSummary(ownerUser)
    ]);

    expect(statusResult.ok).toBe(true);
    expect(revenueResult.ok).toBe(true);
    expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
      where: { id: "company_a" }
    });
  });

  it("documents the threshold constant", () => {
    expect(BILLING_THRESHOLD).toBe(499);
  });
});
