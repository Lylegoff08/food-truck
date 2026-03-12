import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { saveStripeAccountMetadata } from "@/lib/data/billing-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  stripeAccountId: z.string().min(1),
  stripeConnectionStatus: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid payload", 400);
  }

  const result = await saveStripeAccountMetadata(user, parsed.data);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ company: result.data });
}
