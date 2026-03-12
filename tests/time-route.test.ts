import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSessionUserMock = vi.fn();
const clockInEmployeeMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("@/lib/data/time-service", () => ({
  clockInEmployee: clockInEmployeeMock
}));

describe("time clock route", () => {
  beforeEach(() => {
    getSessionUserMock.mockReset();
    clockInEmployeeMock.mockReset();
  });

  it("blocks unauthorized time clock access", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/time/clock-in/route");

    const request = new NextRequest("http://localhost/api/time/clock-in", {
      method: "POST",
      body: JSON.stringify({ employeeId: "employee_1", truckId: "truck_1" }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });
});
