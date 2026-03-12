import { beforeEach, describe, expect, it } from "vitest";
import { buildOrderSnapshot } from "@/lib/data/orders-service";
import { updateProduct } from "@/lib/data/products-service";
import { prismaMock } from "@/tests/setup";

const ownerUser = {
  userId: "user_owner",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

describe("staged product updates", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("keeps historical order snapshot prices after a staged product price change", async () => {
    const snapshot = buildOrderSnapshot(
      [{ id: "product_1", name: "Burger", price: 9.5 }],
      [{ productId: "product_1", quantity: 1 }]
    );

    prismaMock.product.findFirst.mockResolvedValue({
      id: "product_1",
      companyId: "company_a",
      name: "Burger",
      category: "Food",
      price: 9.5,
      active: true,
      archived: false,
      assignedTruckId: null
    });
    prismaMock.product.update.mockResolvedValue({
      id: "product_1",
      price: 11
    });
    prismaMock.productChangeQueue.create.mockResolvedValue({ id: "queue_1" });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit_1" });

    const result = await updateProduct(ownerUser, "product_1", { price: 11 });

    expect(result.ok).toBe(true);
    expect(snapshot.orderItems[0].unitPriceAtSale).toBe(9.5);
  });
});
