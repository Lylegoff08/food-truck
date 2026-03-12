import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { listTruckLocations, updateTruckLocation } from "@/lib/data/gps-service";
import { toDecimalNumber } from "@/lib/db-utils";
import { jsonError } from "@/lib/http";

const schema = z.object({
  truckId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  recordedAt: z.string().datetime().optional()
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const result = await listTruckLocations(user);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({
    locations: result.data.map((location) => ({
      truckId: location.truckId,
      truckName: location.truck.name,
      latitude: toDecimalNumber(location.latitude),
      longitude: toDecimalNumber(location.longitude),
      speed: location.speed ? toDecimalNumber(location.speed, 2) : null,
      heading: location.heading ? toDecimalNumber(location.heading, 2) : null,
      recordedAt: location.recordedAt.toISOString()
    }))
  });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid GPS payload", 400);
  }

  const result = await updateTruckLocation(user, {
    truckId: parsed.data.truckId,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    speed: parsed.data.speed,
    heading: parsed.data.heading,
    recordedAt: parsed.data.recordedAt ? new Date(parsed.data.recordedAt) : undefined
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ location: result.data }, { status: 201 });
}
