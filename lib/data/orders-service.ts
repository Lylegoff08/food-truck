import { prisma } from "@/lib/prisma";
import { processOrderPayment } from "@/lib/data/payment-service";
import { decimal, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, CreateOrderInput, SessionUser } from "@/lib/types";

export function buildOrderSnapshot(
  products: Array<{ id: string; name: string; price: number }>,
  items: CreateOrderInput["items"]
) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not available`);
    }

    const unitPrice = Number(product.price.toFixed(2));
    const quantity = item.quantity;
    const lineTotal = Number((unitPrice * quantity).toFixed(2));

    return {
      productId: product.id,
      productNameAtSale: product.name,
      unitPriceAtSale: unitPrice,
      quantity,
      lineTotalAtSale: lineTotal
    };
  });

  const subtotal = Number(
    orderItems.reduce((sum, item) => sum + item.lineTotalAtSale, 0).toFixed(2)
  );

  return { orderItems, subtotal };
}

export async function createOrder(
  user: SessionUser,
  input: CreateOrderInput
): Promise<AuthResult<{ id: string; paymentStatus: string }>> {
  if (!input.items.length) {
    return fail("Order must include at least one item");
  }

  const truck = await prisma.truck.findFirst({
    where: { id: input.truckId, companyId: user.companyId, active: true }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  if (input.employeeId) {
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, companyId: user.companyId }
    });

    if (!employee) {
      return fail("Employee not found", 404);
    }
  }

  const products = await prisma.product.findMany({
    where: {
      companyId: user.companyId,
      id: { in: input.items.map((item) => item.productId) },
      active: true,
      archived: false
    }
  });

  try {
    const snapshot = buildOrderSnapshot(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price)
      })),
      input.items
    );

    const order = await prisma.order.create({
      data: {
        companyId: user.companyId,
        truckId: input.truckId,
        employeeId: input.employeeId ?? null,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        subtotal: decimal(snapshot.subtotal),
        items: {
          create: snapshot.orderItems.map((item) => ({
            companyId: user.companyId,
            productId: item.productId,
            productNameAtSale: item.productNameAtSale,
            unitPriceAtSale: decimal(item.unitPriceAtSale),
            quantity: item.quantity,
            lineTotalAtSale: decimal(item.lineTotalAtSale)
          }))
        }
      }
    });

    const paymentResult = await processOrderPayment({
      user,
      companyId: user.companyId,
      orderId: order.id,
      amount: snapshot.subtotal,
      paymentMethod: input.paymentMethod,
      paymentPayload: input.paymentPayload
    });

    if (!paymentResult.ok) {
      return paymentResult;
    }

    return ok({ id: order.id, paymentStatus: paymentResult.data.paymentStatus });
  } catch {
    return fail("One or more products are unavailable", 400);
  }
}
