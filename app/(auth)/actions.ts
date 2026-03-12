"use server";

import { redirect } from "next/navigation";
import { loginUser, registerCompany } from "@/lib/data/auth-service";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { readString } from "@/lib/forms";

export async function registerAction(formData: FormData) {
  try {
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
  } catch {
    redirect("/register?error=Unable%20to%20create%20account%20right%20now");
  }
}

export async function loginAction(formData: FormData) {
  try {
    const result = await loginUser({
      email: readString(formData, "email"),
      password: readString(formData, "password")
    });

    if (!result.ok) {
      redirect(`/login?error=${encodeURIComponent(result.error)}`);
    }

    await setSessionCookie(result.data);
    redirect("/dashboard");
  } catch {
    redirect("/login?error=Unable%20to%20sign%20in%20right%20now");
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
