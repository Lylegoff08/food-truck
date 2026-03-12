import { beforeEach, describe, expect, it } from "vitest";
import { updateEmployee } from "@/lib/data/employees-service";
import { updateProduct, listPosProducts } from "@/lib/data/products-service";
import { updateTruck } from "@/lib/data/trucks-service";
import { prismaMock } from "@/tests/setup";

const user = {
  userId: "user_1",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

describe("tenant isolation", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("blocks cross-tenant product updates", async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);

    const result = await updateProduct(user, "product_b", { name: "Updated" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });

  it("blocks cross-tenant truck updates", async () => {
    prismaMock.truck.findFirst.mockResolvedValue(null);

    const result = await updateTruck(user, "truck_b", { name: "Updated" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });

  it("blocks cross-tenant employee updates", async () => {
    prismaMock.employee.findFirst.mockResolvedValue(null);

    const result = await updateEmployee(user, "employee_b", { name: "Updated" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
  });

  it("filters archived products out of the POS list", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    await listPosProducts(user);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: {
        companyId: "company_a",
        active: true,
        archived: false
      },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });
  });
});
