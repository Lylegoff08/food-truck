import { TimeEntryStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/data/audit-service";
import { ensureRole, fail, ok } from "@/lib/service-helpers";
import type {
  AuthResult,
  ClockInInput,
  ClockOutInput,
  SessionUser,
  TimeEntryEditInput
} from "@/lib/types";

export async function listTimeEntries(user: SessionUser) {
  return prisma.timeEntry.findMany({
    where: { companyId: user.companyId },
    include: {
      employee: true,
      truck: true,
      editedByUser: true
    },
    orderBy: [{ clockIn: "desc" }]
  });
}

export async function clockInEmployee(
  user: SessionUser,
  input: ClockInInput
): Promise<AuthResult<{ id: string }>> {
  const employee = await prisma.employee.findFirst({
    where: {
      id: input.employeeId,
      companyId: user.companyId,
      active: true
    }
  });

  if (!employee) {
    return fail("Employee not found", 404);
  }

  const truck = await prisma.truck.findFirst({
    where: {
      id: input.truckId,
      companyId: user.companyId,
      active: true
    }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  const activeEntry = await prisma.timeEntry.findFirst({
    where: {
      companyId: user.companyId,
      employeeId: input.employeeId,
      clockOut: null
    }
  });

  if (activeEntry) {
    return fail("Employee already has an active clock-in", 409);
  }

  const entry = await prisma.timeEntry.create({
    data: {
      companyId: user.companyId,
      employeeId: input.employeeId,
      truckId: input.truckId,
      clockIn: new Date(),
      status: TimeEntryStatus.clocked_in
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "time_entry.clock_in",
    entityType: "TimeEntry",
    entityId: entry.id,
    details: {
      employeeId: input.employeeId,
      truckId: input.truckId
    }
  });

  return ok({ id: entry.id });
}

export async function clockOutEmployee(
  user: SessionUser,
  input: ClockOutInput
): Promise<AuthResult<{ id: string }>> {
  const activeEntry = await prisma.timeEntry.findFirst({
    where: {
      companyId: user.companyId,
      employeeId: input.employeeId,
      clockOut: null
    }
  });

  if (!activeEntry) {
    return fail("No active time entry found", 404);
  }

  const updated = await prisma.timeEntry.update({
    where: { id: activeEntry.id },
    data: {
      clockOut: new Date(),
      status: TimeEntryStatus.clocked_out
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "time_entry.clock_out",
    entityType: "TimeEntry",
    entityId: updated.id,
    details: {
      employeeId: input.employeeId
    }
  });

  return ok({ id: updated.id });
}

export async function editTimeEntry(
  user: SessionUser,
  timeEntryId: string,
  input: TimeEntryEditInput
): Promise<AuthResult<{ id: string }>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  if (!input.reason.trim()) {
    return fail("Edit reason is required");
  }

  const entry = await prisma.timeEntry.findFirst({
    where: {
      id: timeEntryId,
      companyId: user.companyId
    }
  });

  if (!entry) {
    return fail("Time entry not found", 404);
  }

  const truck = await prisma.truck.findFirst({
    where: { id: input.truckId, companyId: user.companyId }
  });

  if (!truck) {
    return fail("Truck not found", 404);
  }

  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: {
      truckId: input.truckId,
      clockIn: input.clockIn,
      clockOut: input.clockOut ?? null,
      status: TimeEntryStatus.edited,
      editedByUserId: user.userId,
      editReason: input.reason.trim()
    }
  });

  await logAuditEvent({
    companyId: user.companyId,
    actorUserId: user.userId,
    action: "time_entry.edit",
    entityType: "TimeEntry",
    entityId: updated.id,
    details: {
      reason: input.reason.trim(),
      previousClockIn: entry.clockIn.toISOString(),
      previousClockOut: entry.clockOut?.toISOString() ?? null
    }
  });

  return ok({ id: updated.id });
}
