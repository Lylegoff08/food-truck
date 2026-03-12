import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { editTimeEntry } from "@/lib/data/time-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  truckId: z.string().min(1),
  clockIn: z.string().datetime(),
  clockOut: z.string().datetime().optional().nullable(),
  reason: z.string().min(1)
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ timeEntryId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { timeEntryId } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid payload", 400);
  }

  const result = await editTimeEntry(user, timeEntryId, {
    truckId: parsed.data.truckId,
    clockIn: new Date(parsed.data.clockIn),
    clockOut: parsed.data.clockOut ? new Date(parsed.data.clockOut) : null,
    reason: parsed.data.reason
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ timeEntry: result.data });
}
