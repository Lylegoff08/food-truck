import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardNav } from "@/components/dashboard-nav";

describe("dashboard nav", () => {
  it("does not show super admin link for tenant users", () => {
    const html = renderToStaticMarkup(<DashboardNav role="owner" />);
    expect(html).not.toContain("Super Admin");
  });

  it("shows super admin link for super admin users", () => {
    const html = renderToStaticMarkup(<DashboardNav role="super_admin" />);
    expect(html).toContain("Super Admin");
  });
});
