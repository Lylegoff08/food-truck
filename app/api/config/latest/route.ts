import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getLatestTruckConfig } from "@/lib/data/config-service";
import { jsonError } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const truckId = request.nextUrl.searchParams.get("truckId");
  if (!truckId) {
    return jsonError("truckId is required", 400);
  }

  const result = await getLatestTruckConfig(user, truckId);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ config: result.data });
}
