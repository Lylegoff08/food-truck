import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateNightlyConfigVersion } from "@/lib/data/config-service";
import { jsonError } from "@/lib/http";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const result = await generateNightlyConfigVersion(user);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ configVersion: result.data }, { status: 201 });
}
