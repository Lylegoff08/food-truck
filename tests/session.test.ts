import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const jwtVerifyMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("jose", () => ({
  jwtVerify: jwtVerifyMock,
  SignJWT: class {
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return "token";
    }
  }
}));

describe("session access", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    jwtVerifyMock.mockReset();
  });

  it("blocks suspended company access", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "token" })
    });
    jwtVerifyMock.mockResolvedValue({
      payload: {
        userId: "user_owner",
        companyId: "company_a",
        email: "owner@a.com",
        role: "owner",
        name: "Owner"
      }
    });

    const { prismaMock } = await import("@/tests/setup");
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user_owner",
      companyId: "company_a",
      email: "owner@a.com",
      role: "owner",
      name: "Owner",
      company: {
        suspended: true
      }
    });

    const { getSessionUser } = await import("@/lib/auth/session");
    const user = await getSessionUser();

    expect(user).toBeNull();
  });
});
