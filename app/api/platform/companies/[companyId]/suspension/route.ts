import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { setCompanySuspension } from "@/lib/data/platform-service";
import { jsonError } from "@/lib/http";

const schema = z.object({
  suspended: z.boolean()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { companyId } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid payload", 400);
  }

  const result = await setCompanySuspension(user, companyId, parsed.data.suspended);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ company: result.data });
}
