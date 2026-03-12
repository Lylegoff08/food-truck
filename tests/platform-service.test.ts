import { beforeEach, describe, expect, it } from "vitest";
import { listPlatformCompanies } from "@/lib/data/platform-service";
import { prismaMock } from "@/tests/setup";

const superAdminUser = {
  userId: "user_super",
  companyId: "company_platform",
  email: "super@demo.com",
  role: "super_admin" as const,
  name: "Super Admin"
};

const tenantOwner = {
  userId: "user_owner",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

describe("platform service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("super admin can list all companies", async () => {
    prismaMock.company.findMany.mockResolvedValue([
      {
        id: "company_a",
        name: "A",
        stripeConnected: true,
        _count: { trucks: 1, employees: 2, orders: 3 },
        weeklyRevenue: []
      }
    ]);

    const result = await listPlatformCompanies(superAdminUser);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
    }
  });

  it("tenant admin cannot access super admin endpoints", async () => {
    const result = await listPlatformCompanies(tenantOwner);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });
});
