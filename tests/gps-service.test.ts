import { beforeEach, describe, expect, it } from "vitest";
import { updateTruckLocation, listTruckLocations } from "@/lib/data/gps-service";
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

describe("gps service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("updates GPS only for company-owned trucks", async () => {
    prismaMock.truck.findFirst.mockResolvedValue({
      id: "truck_1",
      companyId: "company_a"
    });
    prismaMock.truckLocationHistory.findFirst.mockResolvedValue(null);

    const result = await updateTruckLocation(ownerUser, {
      truckId: "truck_1",
      latitude: 34.05,
      longitude: -118.24
    });

    expect(result.ok).toBe(true);
    expect(prismaMock.truckLocation.upsert).toHaveBeenCalledTimes(1);
  });

  it("blocks cross-tenant GPS updates", async () => {
    prismaMock.truck.findFirst.mockResolvedValue(null);

    const result = await updateTruckLocation(ownerUser, {
      truckId: "truck_b",
      latitude: 34.05,
      longitude: -118.24
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });

  it("rejects invalid GPS payloads", async () => {
    prismaMock.truck.findFirst.mockResolvedValue({
      id: "truck_1",
      companyId: "company_a"
    });

    const result = await updateTruckLocation(ownerUser, {
      truckId: "truck_1",
      latitude: 999,
      longitude: -118.24
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid GPS payload");
    }
  });

  it("enforces manager-owner boundary on GPS admin reads", async () => {
    const result = await listTruckLocations(cashierUser);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });
});
