import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listTimeEntries } from "@/lib/data/time-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const entries = await listTimeEntries(user);
  return NextResponse.json({ timeEntries: entries });
}
