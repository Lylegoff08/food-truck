import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

export async function requireSession() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSuperAdminSession() {
  const user = await requireSession();

  if (user.role !== UserRole.super_admin) {
    redirect("/dashboard");
  }

  return user;
}
