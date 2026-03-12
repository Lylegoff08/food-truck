import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getWeeklyRevenueSummary } from "@/lib/data/billing-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const result = await getWeeklyRevenueSummary(user);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ revenue: result.data });
}
