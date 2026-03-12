import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, registrationSchema } from "@/lib/auth/validators";
import { fail, ok } from "@/lib/service-helpers";
import type { AuthResult, SessionUser } from "@/lib/types";

function toSessionUser(user: {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
}): SessionUser {
  return {
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
    name: user.name
  };
}

export async function registerCompany(input: unknown): Promise<AuthResult<SessionUser>> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid registration data");
  }

  const { companyName, companySlug, ownerName, email, password } = parsed.data;

  const existingCompany = await prisma.company.findUnique({
    where: { slug: companySlug }
  });

  if (existingCompany) {
    return fail("Company slug already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  const created = await prisma.company.create({
    data: {
      name: companyName,
      slug: companySlug,
      users: {
        create: {
          name: ownerName,
          email,
          passwordHash,
          role: UserRole.owner
        }
      }
    },
    include: {
      users: true
    }
  });

  return ok(toSessionUser(created.users[0]));
}

export async function loginUser(input: unknown): Promise<AuthResult<SessionUser>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid login data");
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { email, active: true }
  });

  if (!user) {
    return fail("Invalid email or password", 401);
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return fail("Invalid email or password", 401);
  }

  return ok(toSessionUser(user));
}
