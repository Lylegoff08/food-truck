import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAuditEvent(input: {
  companyId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue | null;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details ?? undefined
    }
  });
}
