import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import {
  addPayRate,
  getCurrentPayRate,
  listPayRateHistory
} from "@/lib/data/pay-rates-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  hourlyRate: z.number().min(0),
  effectiveDate: z.string().datetime()
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { employeeId } = await params;
  const [current, history] = await Promise.all([
    getCurrentPayRate(user, employeeId),
    listPayRateHistory(user, employeeId)
  ]);

  return NextResponse.json({ current, history });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { employeeId } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid payload", 400);
  }

  const result = await addPayRate(user, {
    employeeId,
    hourlyRate: parsed.data.hourlyRate,
    effectiveDate: new Date(parsed.data.effectiveDate)
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ payRate: result.data }, { status: 201 });
}
