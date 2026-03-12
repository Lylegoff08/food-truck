import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { loginUser, registerCompany } from "@/lib/data/auth-service";
import { prismaMock } from "@/tests/setup";

describe("auth service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => fn.mockReset());
    });
  });

  it("registers a company and owner", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    prismaMock.company.create.mockResolvedValue({
      id: "company_1",
      name: "Demo",
      slug: "demo",
      users: [
        {
          id: "user_1",
          companyId: "company_1",
          email: "owner@example.com",
          name: "Owner",
          role: "owner"
        }
      ]
    });

    const result = await registerCompany({
      companyName: "Demo",
      companySlug: "demo",
      ownerName: "Owner",
      email: "owner@example.com",
      password: "password123"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.companyId).toBe("company_1");
      expect(result.data.role).toBe("owner");
    }
  });

  it("logs in an active user", async () => {
    const passwordHash = await hashPassword("password123");
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user_1",
      companyId: "company_1",
      email: "owner@example.com",
      name: "Owner",
      role: "owner",
      active: true,
      passwordHash
    });

    const result = await loginUser({
      email: "owner@example.com",
      password: "password123"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("owner@example.com");
    }
  });

  it("rejects duplicate registration emails cleanly", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user_existing",
      email: "owner@example.com"
    });

    const result = await registerCompany({
      companyName: "Demo",
      companySlug: "demo-2",
      ownerName: "Owner",
      email: "owner@example.com",
      password: "password123"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.error).toBe("Email already exists");
    }
  });
});
