import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSessionUserMock = vi.fn();
const listPlatformCompaniesMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("@/lib/data/platform-service", () => ({
  listPlatformCompanies: listPlatformCompaniesMock
}));

describe("platform companies route", () => {
  beforeEach(() => {
    getSessionUserMock.mockReset();
    listPlatformCompaniesMock.mockReset();
  });

  it("returns forbidden for tenant admins", async () => {
    getSessionUserMock.mockResolvedValue({
      userId: "user_owner",
      companyId: "company_a",
      role: "owner"
    });
    listPlatformCompaniesMock.mockResolvedValue({
      ok: false,
      error: "Forbidden",
      status: 403
    });

    const { GET } = await import("@/app/api/platform/companies/route");
    const response = await GET(new NextRequest("http://localhost/api/platform/companies") as never);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });
});
