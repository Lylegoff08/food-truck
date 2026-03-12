import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { updateTruck } from "@/lib/data/trucks-service";
import { jsonError } from "@/lib/http";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ truckId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { truckId } = await params;
  const body = await request.json();
  const result = await updateTruck(user, truckId, body);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ truck: result.data });
}
