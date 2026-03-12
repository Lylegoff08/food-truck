import { beforeEach, describe, expect, it } from "vitest";
import {
  clockInEmployee,
  editTimeEntry
} from "@/lib/data/time-service";
import { prismaMock } from "@/tests/setup";

const ownerUser = {
  userId: "user_owner",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

const cashierUser = {
  ...ownerUser,
  role: "cashier" as const
};

describe("time service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("blocks duplicate active clock-ins", async () => {
    prismaMock.employee.findFirst.mockResolvedValue({
      id: "employee_1",
      companyId: "company_a",
      active: true
    });
    prismaMock.truck.findFirst.mockResolvedValue({
      id: "truck_1",
      companyId: "company_a",
      active: true
    });
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "time_1",
      companyId: "company_a",
      employeeId: "employee_1",
      clockOut: null
    });

    const result = await clockInEmployee(ownerUser, {
      employeeId: "employee_1",
      truckId: "truck_1"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
    }
  });

  it("requires a reason when editing time entries", async () => {
    const result = await editTimeEntry(ownerUser, "time_1", {
      truckId: "truck_1",
      clockIn: new Date("2026-03-12T08:00:00.000Z"),
      clockOut: new Date("2026-03-12T16:00:00.000Z"),
      reason: "   "
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Edit reason is required");
    }
  });

  it("blocks cashier time entry edits", async () => {
    const result = await editTimeEntry(cashierUser, "time_1", {
      truckId: "truck_1",
      clockIn: new Date("2026-03-12T08:00:00.000Z"),
      clockOut: new Date("2026-03-12T16:00:00.000Z"),
      reason: "Manager correction"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("blocks cross-tenant time clock access", async () => {
    prismaMock.employee.findFirst.mockResolvedValue(null);

    const result = await clockInEmployee(ownerUser, {
      employeeId: "employee_b",
      truckId: "truck_1"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });

  it("rejects invalid truck ids on clock-in", async () => {
    prismaMock.employee.findFirst.mockResolvedValue({
      id: "employee_1",
      companyId: "company_a",
      active: true
    });
    prismaMock.truck.findFirst.mockResolvedValue(null);

    const result = await clockInEmployee(ownerUser, {
      employeeId: "employee_1",
      truckId: "truck_missing"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });
});
