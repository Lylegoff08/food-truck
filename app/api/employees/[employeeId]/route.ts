import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { updateEmployee } from "@/lib/data/employees-service";
import { jsonError } from "@/lib/http";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { employeeId } = await params;
  const body = await request.json();
  const result = await updateEmployee(user, employeeId, body);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ employee: result.data });
}
