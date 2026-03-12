import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getPaymentTransaction } from "@/lib/data/payment-service";
import { jsonError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { paymentId } = await params;
  const result = await getPaymentTransaction(user, paymentId);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ payment: result.data });
}
