import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listPlatformCompanies } from "@/lib/data/platform-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const result = await listPlatformCompanies(user);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ companies: result.data });
}
