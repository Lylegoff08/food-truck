import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

type TruckInput = {
  name: string;
  active?: boolean;
};

export async function listTrucks(user: SessionUser) {
  return prisma.truck.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "asc" }
  });
}

export async function createTruck(
  user: SessionUser,
  input: TruckInput
): Promise<AuthResult<Awaited<ReturnType<typeof prisma.truck.create>>>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  if (!input.name?.trim()) {
    return fail("Truck name is required");
  }

  return ok(
    await prisma.truck.create({
      data: {
        companyId: user.companyId,
        name: input.name.trim(),
        active: input.active ?? true
      }
    })
  );
}

export async function updateTruck(
  user: SessionUser,
  truckId: string,
  input: TruckInput
): Promise<AuthResult<Awaited<ReturnType<typeof prisma.truck.update>>>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const truck = await prisma.truck.findFirst({
    where: { id: truckId, companyId: user.companyId }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  return ok(
    await prisma.truck.update({
      where: { id: truck.id },
      data: {
        name: input.name?.trim() || truck.name,
        active: input.active ?? truck.active
      }
    })
  );
}
