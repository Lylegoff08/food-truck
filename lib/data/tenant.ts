import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

export async function requireCompanyTruck(user: SessionUser, truckId: string) {
  const truck = await prisma.truck.findFirst({
    where: { id: truckId, companyId: user.companyId }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  return ok(truck);
}

export async function requireCompanyEmployee(user: SessionUser, employeeId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId }
  });

  if (!employee) {
    return fail("Employee not found", 404);
  }

  return ok(employee);
}

export async function requireCompanyProduct(user: SessionUser, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: user.companyId }
  });

  if (!product) {
    return fail("Product not found", 404);
  }

  return ok(product);
}

export async function withTenant<T>(
  user: SessionUser,
  loader: (companyId: string) => Promise<T>
): Promise<AuthResult<T>> {
  return ok(await loader(user.companyId));
}
