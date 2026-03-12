"use server";

import { redirect } from "next/navigation";
import { loginUser, registerCompany } from "@/lib/data/auth-service";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { readString } from "@/lib/forms";

export async function registerAction(formData: FormData) {
  const result = await registerCompany({
    companyName: readString(formData, "companyName"),
    companySlug: readString(formData, "companySlug"),
    ownerName: readString(formData, "ownerName"),
    email: readString(formData, "email"),
    password: readString(formData, "password")
  });

  if (!result.ok) {
    redirect(`/register?error=${encodeURIComponent(result.error)}`);
  }

  await setSessionCookie(result.data);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const result = await loginUser({
    email: readString(formData, "email"),
    password: readString(formData, "password")
  });

  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }

  await setSessionCookie(result.data);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
