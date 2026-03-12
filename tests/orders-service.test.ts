import { beforeEach, describe, expect, it } from "vitest";
import { buildOrderSnapshot, createOrder } from "@/lib/data/orders-service";
import { prismaMock } from "@/tests/setup";

const user = {
  userId: "user_1",
  companyId: "company_a",
  email: "owner@a.com",
  role: "owner" as const,
  name: "Owner"
};

describe("orders service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("builds stable sale snapshots", () => {
    const snapshot = buildOrderSnapshot(
      [{ id: "product_1", name: "Burger", price: 9.5 }],
      [{ productId: "product_1", quantity: 2 }]
    );

    expect(snapshot.subtotal).toBe(19);
    expect(snapshot.orderItems[0]).toEqual({
      productId: "product_1",
      productNameAtSale: "Burger",
      unitPriceAtSale: 9.5,
      quantity: 2,
      lineTotalAtSale: 19
    });
  });

  it("stores order item snapshot values when creating an order", async () => {
    prismaMock.truck.findFirst.mockResolvedValue({
      id: "truck_1",
      companyId: "company_a",
      active: true
    });
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "product_1",
        companyId: "company_a",
        name: "Burger",
        price: 9.5,
        active: true,
        archived: false
      }
    ]);
    prismaMock.order.create.mockResolvedValue({ id: "order_1" });
    prismaMock.company.findUnique.mockResolvedValue({
      id: "company_a",
      stripeConnected: false,
      stripeAccountId: null
    });
    prismaMock.paymentTransaction.create.mockResolvedValue({ id: "payment_1" });
    prismaMock.order.update.mockResolvedValue({ id: "order_1", paymentStatus: "paid" });

    const result = await createOrder(user, {
      truckId: "truck_1",
      paymentMethod: "cash",
      items: [{ productId: "product_1", quantity: 3 }]
    });

    expect(result.ok).toBe(true);
    expect(prismaMock.order.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.paymentTransaction.create).toHaveBeenCalledTimes(1);

    const createCall = prismaMock.order.create.mock.calls[0][0];
    expect(createCall.data.items.create[0].productNameAtSale).toBe("Burger");
    expect(createCall.data.items.create[0].quantity).toBe(3);
  });
});
