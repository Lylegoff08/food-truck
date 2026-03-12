import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createProduct, listProducts } from "@/lib/data/products-service";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const products = await listProducts(user);
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json();
  const result = await createProduct(user, body);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ product: result.data }, { status: 201 });
}
