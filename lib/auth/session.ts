import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

const COOKIE_NAME = "foodtruck_session";

type SessionPayload = SessionUser & { exp: number };

function getSecret() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const result = await jwtVerify(token, getSecret());
  return result.payload as unknown as SessionPayload;
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        companyId: payload.companyId,
        active: true
      },
      include: {
        company: true
      }
    });

    if (!user) {
      return null;
    }

    if (user.company.suspended && user.role !== "super_admin") {
      return null;
    }

    return {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      name: user.name,
      companySuspended: user.company.suspended
    } satisfies SessionUser;
  } catch {
    return null;
  }
}
