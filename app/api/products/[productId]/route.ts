import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { updateProduct } from "@/lib/data/products-service";
import { jsonError } from "@/lib/http";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { productId } = await params;
  const body = await request.json();
  const result = await updateProduct(user, productId, body);

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({ product: result.data });
}
