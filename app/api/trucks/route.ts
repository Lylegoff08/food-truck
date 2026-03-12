import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createTruck, listTrucks } from "@/lib/data/trucks-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const trucks = await listTrucks(user);
  return NextResponse.json({ trucks });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json();
  const result = await createTruck(user, body);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ truck: result.data }, { status: 201 });
}
