import { NextRequest, NextResponse } from "next/server";
import { registerCompany } from "@/lib/data/auth-service";
import { setSessionCookie } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await registerCompany(body);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  await setSessionCookie(result.data);
  return NextResponse.json({ user: result.data }, { status: 201 });
}
