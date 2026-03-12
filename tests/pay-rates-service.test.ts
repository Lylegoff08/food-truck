import { beforeEach, describe, expect, it } from "vitest";
import {
  addPayRate,
  getCurrentPayRate,
  listPayRateHistory
} from "@/lib/data/pay-rates-service";
import { prismaMock } from "@/tests/setup";

const managerUser = {
  userId: "user_manager",
  companyId: "company_a",
  email: "manager@a.com",
  role: "manager" as const,
  name: "Manager"
};

const cashierUser = {
  ...managerUser,
  role: "cashier" as const
};

describe("pay rate service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("preserves pay rate history by creating new records", async () => {
    prismaMock.employee.findFirst.mockResolvedValue({
      id: "employee_1",
      companyId: "company_a"
    });
    prismaMock.payRate.create.mockResolvedValue({
      id: "rate_2"
    });
    prismaMock.payRate.findMany.mockResolvedValue([
      { id: "rate_2", hourlyRate: 20, effectiveDate: new Date("2026-03-01T00:00:00.000Z") },
      { id: "rate_1", hourlyRate: 18, effectiveDate: new Date("2026-01-01T00:00:00.000Z") }
    ]);

    const addResult = await addPayRate(managerUser, {
      employeeId: "employee_1",
      hourlyRate: 20,
      effectiveDate: new Date("2026-03-01T00:00:00.000Z")
    });
    const history = await listPayRateHistory(managerUser, "employee_1");

    expect(addResult.ok).toBe(true);
    expect(prismaMock.payRate.create).toHaveBeenCalledTimes(1);
    expect(history).toHaveLength(2);
    expect(history[1].hourlyRate).toBe(18);
  });

  it("fetches the current pay rate", async () => {
    prismaMock.payRate.findFirst.mockResolvedValue({
      id: "rate_2",
      hourlyRate: 20
    });

    const rate = await getCurrentPayRate(managerUser, "employee_1");

    expect(rate?.id).toBe("rate_2");
    expect(prismaMock.payRate.findFirst).toHaveBeenCalled();
  });

  it("blocks cross-tenant pay rate writes", async () => {
    prismaMock.employee.findFirst.mockResolvedValue(null);

    const result = await addPayRate(managerUser, {
      employeeId: "employee_b",
      hourlyRate: 20,
      effectiveDate: new Date("2026-03-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });

  it("blocks cashier pay rate writes", async () => {
    const result = await addPayRate(cashierUser, {
      employeeId: "employee_1",
      hourlyRate: 20,
      effectiveDate: new Date("2026-03-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });
});
