import {
  ConfigTruckStatus,
  Prisma,
  ProductChangeAction,
  UserRole
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

function nextReleaseDate(now = new Date()) {
  const release = new Date(now);
  release.setHours(2, 0, 0, 0);

  if (now.getHours() >= 23) {
    release.setDate(release.getDate() + 2);
  } else {
    release.setDate(release.getDate() + 1);
  }

  return release;
}

export async function enqueueProductChange(input: {
  companyId: string;
  productId: string;
  action: ProductChangeAction;
  changedFields: Prisma.InputJsonValue;
}) {
  await prisma.productChangeQueue.create({
    data: {
      companyId: input.companyId,
      productId: input.productId,
      action: input.action,
      changedFields: input.changedFields
    }
  });
}

export async function listConfigVersions(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  return ok(
    await prisma.configVersion.findMany({
      where: { companyId: user.companyId },
      include: {
        truckStatuses: {
          include: { truck: true },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { generatedAt: "desc" }
    })
  );
}

export async function generateNightlyConfigVersion(
  user: SessionUser
): Promise<AuthResult<{ id: string; versionNumber: number }>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const [latestVersion, products, trucks, pendingChanges] = await Promise.all([
    prisma.configVersion.findFirst({
      where: { companyId: user.companyId },
      orderBy: { versionNumber: "desc" }
    }),
    prisma.product.findMany({
      where: { companyId: user.companyId },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    }),
    prisma.truck.findMany({
      where: { companyId: user.companyId, active: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.productChangeQueue.findMany({
      where: {
        companyId: user.companyId,
        includedInConfigVersionId: null
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;
  const releaseDate = nextReleaseDate();

  const bundleJson: Prisma.InputJsonValue = {
    companyId: user.companyId,
    versionNumber,
    generatedAt: new Date().toISOString(),
    releaseDate: releaseDate.toISOString(),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      active: product.active,
      archived: product.archived,
      assignedTruckId: product.assignedTruckId
    })),
    pendingChangeCount: pendingChanges.length
  };

  const version = await prisma.configVersion.create({
    data: {
      companyId: user.companyId,
      versionNumber,
      releaseDate,
      bundleJson,
      truckStatuses: {
        create: trucks.map((truck) => ({
          companyId: user.companyId,
          truckId: truck.id,
          status: ConfigTruckStatus.pending
        }))
      }
    }
  });

  if (pendingChanges.length) {
    await prisma.productChangeQueue.updateMany({
      where: {
        companyId: user.companyId,
        includedInConfigVersionId: null
      },
      data: {
        includedInConfigVersionId: version.id
      }
    });
  }

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "config.generate",
    entityType: "ConfigVersion",
    entityId: version.id,
    details: {
      versionNumber,
      pendingChangeCount: pendingChanges.length
    }
  });

  return ok({ id: version.id, versionNumber });
}

export async function getLatestTruckConfig(user: SessionUser, truckId: string) {
  const truck = await prisma.truck.findFirst({
    where: { id: truckId, companyId: user.companyId }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  const latest = await prisma.configVersionTruck.findFirst({
    where: {
      companyId: user.companyId,
      truckId
    },
    include: {
      configVersion: true
    },
    orderBy: {
      configVersion: {
        versionNumber: "desc"
      }
    }
  });

  if (!latest) {
    return fail("No config version found", 404);
  }

  return ok(latest);
}

export async function acknowledgeTruckConfig(
  user: SessionUser,
  input: {
    truckId: string;
    configVersionId: string;
    success: boolean;
    errorMessage?: string;
  }
): Promise<AuthResult<{ id: string }>> {
  const ack = await prisma.configVersionTruck.findFirst({
    where: {
      configVersionId: input.configVersionId,
      truckId: input.truckId,
      companyId: user.companyId
    }
  });

  if (!ack) {
    return fail("Config acknowledgment target not found", 404);
  }

  const updated = await prisma.configVersionTruck.update({
    where: { id: ack.id },
    data: {
      status: input.success ? ConfigTruckStatus.applied : ConfigTruckStatus.failed,
      acknowledgedAt: new Date(),
      errorMessage: input.success ? null : input.errorMessage ?? "Unknown error"
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: input.success ? "config.ack_success" : "config.ack_failure",
    entityType: "ConfigVersionTruck",
    entityId: updated.id,
    details: {
      truckId: input.truckId,
      configVersionId: input.configVersionId,
      errorMessage: updated.errorMessage
    }
  });

  return ok({ id: updated.id });
}
