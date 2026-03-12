import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createOrder } from "@/lib/data/orders-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  truckId: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  paymentMethod: z.enum(["cash", "card"]),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive()
    })
  ),
  paymentPayload: z
    .object({
      paymentToken: z.string().optional().nullable(),
      simulateFailure: z.boolean().optional()
    })
    .optional()
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return jsonError("Invalid payment payload", 400);
  }

  const result = await createOrder(user, body.data);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ order: result.data }, { status: 201 });
}
