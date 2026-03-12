import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { decimal, ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, LocationUpdateInput, SessionUser } from "@/lib/types";

const HISTORY_INTERVAL_MS = 5 * 60 * 1000;

export async function listTruckLocations(user: SessionUser) {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  return ok(
    await prisma.truckLocation.findMany({
      where: { companyId: user.companyId },
      include: { truck: true },
      orderBy: { recordedAt: "desc" }
    })
  );
}

export async function updateTruckLocation(
  user: SessionUser,
  input: LocationUpdateInput
): Promise<AuthResult<{ truckId: string }>> {
  const truck = await prisma.truck.findFirst({
    where: {
      id: input.truckId,
      companyId: user.companyId
    }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    return fail("Invalid GPS payload");
  }

  const recordedAt = input.recordedAt ?? new Date();

  await prisma.truckLocation.upsert({
    where: { truckId: input.truckId },
    create: {
      truckId: input.truckId,
      companyId: user.companyId,
      latitude: decimal(input.latitude),
      longitude: decimal(input.longitude),
      speed:
        input.speed === undefined || input.speed === null
          ? null
          : decimal(input.speed),
      heading:
        input.heading === undefined || input.heading === null
          ? null
          : decimal(input.heading),
      recordedAt
    },
    update: {
      latitude: decimal(input.latitude),
      longitude: decimal(input.longitude),
      speed:
        input.speed === undefined || input.speed === null
          ? null
          : decimal(input.speed),
      heading:
        input.heading === undefined || input.heading === null
          ? null
          : decimal(input.heading),
      recordedAt
    }
  });

  const latestHistory = await prisma.truckLocationHistory.findFirst({
    where: {
      companyId: user.companyId,
      truckId: input.truckId
    },
    orderBy: { recordedAt: "desc" }
  });

  if (
    !latestHistory ||
    recordedAt.getTime() - new Date(latestHistory.recordedAt).getTime() >= HISTORY_INTERVAL_MS
  ) {
    await prisma.truckLocationHistory.create({
      data: {
        truckId: input.truckId,
        companyId: user.companyId,
        latitude: decimal(input.latitude),
        longitude: decimal(input.longitude),
        speed:
          input.speed === undefined || input.speed === null
            ? null
            : decimal(input.speed),
        heading:
          input.heading === undefined || input.heading === null
            ? null
            : decimal(input.heading),
        recordedAt
      }
    });
  }

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "gps.update",
    entityType: "TruckLocation",
    entityId: input.truckId,
    details: {
      latitude: input.latitude,
      longitude: input.longitude,
      recordedAt: recordedAt.toISOString()
    }
  });

  return ok({ truckId: input.truckId });
}
