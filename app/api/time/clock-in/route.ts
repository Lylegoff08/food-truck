import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { clockInEmployee } from "@/lib/data/time-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  employeeId: z.string().min(1),
  truckId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return jsonError("Invalid payload", 400);
  }

  const result = await clockInEmployee(user, body.data);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ timeEntry: result.data }, { status: 201 });
}
