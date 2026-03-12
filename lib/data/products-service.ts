import { Prisma, ProductChangeAction, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { enqueueProductChange } from "@/lib/data/config-service";
import { ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

type ProductInput = {
  name: string;
  category: string;
  price: number;
  active?: boolean;
  archived?: boolean;
  assignedTruckId?: string | null;
};

export async function listProducts(user: SessionUser) {
  return prisma.product.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "asc" }
  });
}

export async function listPosProducts(user: SessionUser) {
  return prisma.product.findMany({
    where: {
      companyId: user.companyId,
      active: true,
      archived: false
    },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });
}

export async function createProduct(
  user: SessionUser,
  input: ProductInput
): Promise<AuthResult<Awaited<ReturnType<typeof prisma.product.create>>>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  if (!input.name?.trim() || !input.category?.trim()) {
    return fail("Name and category are required");
  }

  if (Number.isNaN(input.price) || input.price < 0) {
    return fail("Price must be zero or greater");
  }

  const product = await prisma.product.create({
    data: {
      companyId: user.companyId,
      name: input.name.trim(),
      category: input.category.trim(),
      price: input.price,
      active: input.active ?? true,
      archived: input.archived ?? false,
      assignedTruckId: input.assignedTruckId ?? null
    }
  });

  await enqueueProductChange({
    companyId: user.companyId,
    productId: product.id,
    action: ProductChangeAction.created,
    changedFields: {
      name: product.name,
      category: product.category,
      price: Number(product.price)
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    details: {
      price: Number(product.price)
    }
  });

  return ok(product);
}

export async function updateProduct(
  user: SessionUser,
  productId: string,
  input: Partial<ProductInput>
): Promise<AuthResult<Awaited<ReturnType<typeof prisma.product.update>>>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: user.companyId }
  });

  if (!product) {
    return fail("Product not found", 404);
  }

  const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: input.name?.trim() || product.name,
        category: input.category?.trim() || product.category,
        price: input.price ?? product.price,
        active: input.active ?? product.active,
        archived: input.archived ?? product.archived,
        assignedTruckId:
          input.assignedTruckId === undefined
            ? product.assignedTruckId
            : input.assignedTruckId
      }
    });

  const changedFields: Record<string, Prisma.InputJsonValue> = {};
  if (input.name !== undefined && input.name !== product.name) {
    changedFields.name = {
      from: product.name,
      to: input.name
    } as Prisma.InputJsonValue;
  }
  if (input.category !== undefined && input.category !== product.category) {
    changedFields.category = {
      from: product.category,
      to: input.category
    } as Prisma.InputJsonValue;
  }
  if (input.price !== undefined && Number(input.price) !== Number(product.price)) {
    changedFields.price = {
      from: Number(product.price),
      to: input.price
    } as Prisma.InputJsonValue;
  }
  if (input.active !== undefined && input.active !== product.active) {
    changedFields.active = {
      from: product.active,
      to: input.active
    } as Prisma.InputJsonValue;
  }
  if (input.archived !== undefined && input.archived !== product.archived) {
    changedFields.archived = {
      from: product.archived,
      to: input.archived
    } as Prisma.InputJsonValue;
  }

  await enqueueProductChange({
    companyId: user.companyId,
    productId: product.id,
    action: updated.archived ? ProductChangeAction.archived : ProductChangeAction.updated,
    changedFields: changedFields as Prisma.InputJsonValue
  });

  if ("price" in changedFields) {
    await logAuditEvent({
      companyId: user.companyId,
      actorUserId: user.userId,
      action: "product.price_change",
      entityType: "Product",
      entityId: updated.id,
      details: changedFields.price as Prisma.InputJsonValue
    });
  }

  return ok(updated);
}
