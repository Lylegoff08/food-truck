import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureRole, fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

type EmployeeInput = {
  name: string;
  active?: boolean;
  title?: string | null;
  assignedTruckId?: string | null;
};

export async function listEmployees(user: SessionUser) {
  return prisma.employee.findMany({
    where: { companyId: user.companyId },
    include: { assignedTruck: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function getEmployee(user: SessionUser, employeeId: string) {
  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: user.companyId
    },
    include: {
      assignedTruck: true
    }
  });
}

export async function createEmployee(
  user: SessionUser,
  input: EmployeeInput
): Promise<AuthResult<Awaited<ReturnType<typeof prisma.employee.create>>>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  if (!input.name?.trim()) {
    return fail("Employee name is required");
  }

  if (input.assignedTruckId) {
    const truck = await prisma.truck.findFirst({
      where: { id: input.assignedTruckId, companyId: user.companyId }
    });

    if (!truck) {
      return fail("Assigned truck not found", 404);
    }
  }

  return ok(
    await prisma.employee.create({
      data: {
        companyId: user.companyId,
        name: input.name.trim(),
        active: input.active ?? true,
        title: input.title?.trim() || null,
        assignedTruckId: input.assignedTruckId ?? null
      }
    })
  );
}

export async function updateEmployee(
  user: SessionUser,
  employeeId: string,
  input: Partial<EmployeeInput>
): Promise<AuthResult<Awaited<ReturnType<typeof prisma.employee.update>>>> {
  const roleCheck = ensureRole(user, [UserRole.owner, UserRole.manager]);
  if (!roleCheck.ok) {
    return roleCheck;
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId }
  });

  if (!employee) {
    return fail("Employee not found", 404);
  }

  if (input.assignedTruckId) {
    const truck = await prisma.truck.findFirst({
      where: { id: input.assignedTruckId, companyId: user.companyId }
    });

    if (!truck) {
      return fail("Assigned truck not found", 404);
    }
  }

  return ok(
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        name: input.name?.trim() || employee.name,
        active: input.active ?? employee.active,
        title: input.title === undefined ? employee.title : input.title,
        assignedTruckId:
          input.assignedTruckId === undefined
            ? employee.assignedTruckId
            : input.assignedTruckId
      }
    })
  );
}
