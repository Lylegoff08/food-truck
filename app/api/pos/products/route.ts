import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listPosProducts } from "@/lib/data/products-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const products = await listPosProducts(user);
  return NextResponse.json({ products });
}
