import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { acknowledgeTruckConfig } from "@/lib/data/config-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  truckId: z.string().min(1),
  configVersionId: z.string().min(1),
  success: z.boolean(),
  errorMessage: z.string().optional()
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

  const result = await acknowledgeTruckConfig(user, parsed.data);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ ack: result.data });
}
