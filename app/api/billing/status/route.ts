import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getBillingStatus, getWeeklyRevenueSummary } from "@/lib/data/billing-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const [statusResult, revenueResult] = await Promise.all([
    getBillingStatus(user),
    getWeeklyRevenueSummary(user)
  ]);

  if (!statusResult.ok) {
    return jsonError(statusResult.error, statusResult.status);
  }

  if (!revenueResult.ok) {
    return jsonError(revenueResult.error, revenueResult.status);
  }

  return NextResponse.json({
    company: statusResult.data,
    revenue: revenueResult.data
  });
}
