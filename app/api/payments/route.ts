import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listPaymentTransactions } from "@/lib/data/payment-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const result = await listPaymentTransactions(user);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ payments: result.data });
}
