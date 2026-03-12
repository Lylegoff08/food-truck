import { beforeEach, describe, expect, it } from "vitest";
import {
  acknowledgeTruckConfig,
  generateNightlyConfigVersion
} from "@/lib/data/config-service";
import { prismaMock } from "@/tests/setup";

const managerUser = {
  userId: "user_manager",
  companyId: "company_a",
  email: "manager@a.com",
  role: "manager" as const,
  name: "Manager"
};

describe("config service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("creates a new config version even with no queued changes", async () => {
    prismaMock.configVersion.findFirst.mockResolvedValue({
      versionNumber: 4
    });
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.truck.findMany.mockResolvedValue([
      { id: "truck_1", companyId: "company_a" }
    ]);
    prismaMock.productChangeQueue.findMany.mockResolvedValue([]);
    prismaMock.configVersion.create.mockResolvedValue({
      id: "config_5",
      versionNumber: 5
    });

    const result = await generateNightlyConfigVersion(managerUser);

    expect(result.ok).toBe(true);
    expect(prismaMock.configVersion.create).toHaveBeenCalledTimes(1);
  });

  it("acknowledges config success", async () => {
    prismaMock.configVersionTruck.findFirst.mockResolvedValue({
      id: "ack_1",
      companyId: "company_a"
    });
    prismaMock.configVersionTruck.update.mockResolvedValue({
      id: "ack_1",
      errorMessage: null
    });

    const result = await acknowledgeTruckConfig(managerUser, {
      truckId: "truck_1",
      configVersionId: "config_1",
      success: true
    });

    expect(result.ok).toBe(true);
    expect(prismaMock.configVersionTruck.update).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid config acknowledgments", async () => {
    prismaMock.configVersionTruck.findFirst.mockResolvedValue(null);

    const result = await acknowledgeTruckConfig(managerUser, {
      truckId: "truck_1",
      configVersionId: "config_missing",
      success: false,
      errorMessage: "Not found on truck"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });
});
