import React from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { UserRole } from "@prisma/client";

export function DashboardNav({ role }: { role: UserRole }) {
  return (
    <nav className="row">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/trucks">Trucks</Link>
      <Link href="/dashboard/products">Products</Link>
      <Link href="/dashboard/employees">Employees</Link>
      <Link href="/dashboard/time-clock">Time Clock</Link>
      <Link href="/dashboard/time-entries">Time Entries</Link>
      <Link href="/dashboard/pos">POS</Link>
      <Link href="/dashboard/gps">GPS</Link>
      <Link href="/dashboard/config">Config</Link>
      <Link href="/dashboard/billing">Billing</Link>
      {role === UserRole.super_admin ? (
        <Link href="/dashboard/super-admin">Super Admin</Link>
      ) : null}
      <form action={logoutAction}>
        <button type="submit">Logout</button>
      </form>
    </nav>
  );
}
