import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { startStripeConnectFlow } from "@/lib/data/billing-service";
import { jsonError } from "@/lib/http";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const result = await startStripeConnectFlow(user);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ connect: result.data }, { status: 201 });
}
