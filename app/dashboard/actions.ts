"use server";

import { redirect } from "next/navigation";
import { requireSession, requireSuperAdminSession } from "@/lib/auth/server";
import {
  disconnectStripeAccount,
  saveStripeAccountMetadata,
  startStripeConnectFlow
} from "@/lib/data/billing-service";
import { generateNightlyConfigVersion } from "@/lib/data/config-service";
import { createEmployee, updateEmployee } from "@/lib/data/employees-service";
import { createOrder } from "@/lib/data/orders-service";
import { addPayRate } from "@/lib/data/pay-rates-service";
import { setCompanySuspension } from "@/lib/data/platform-service";
import { createProduct, updateProduct } from "@/lib/data/products-service";
import { clockInEmployee, clockOutEmployee, editTimeEntry } from "@/lib/data/time-service";
import { createTruck, updateTruck } from "@/lib/data/trucks-service";
import { readBoolean, readString } from "@/lib/forms";

export async function saveTruckAction(formData: FormData) {
  const user = await requireSession();
  const id = readString(formData, "id");

  const payload = {
    name: readString(formData, "name"),
    active: readBoolean(formData, "active")
  };

  const result = id
    ? await updateTruck(user, id, payload)
    : await createTruck(user, payload);

  if (!result.ok) {
    redirect(`/dashboard/trucks?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/trucks");
}

export async function saveProductAction(formData: FormData) {
  const user = await requireSession();
  const id = readString(formData, "id");

  const payload = {
    name: readString(formData, "name"),
    category: readString(formData, "category"),
    price: Number(readString(formData, "price")),
    active: readBoolean(formData, "active"),
    archived: readBoolean(formData, "archived"),
    assignedTruckId: readString(formData, "assignedTruckId") || null
  };

  const result = id
    ? await updateProduct(user, id, payload)
    : await createProduct(user, payload);

  if (!result.ok) {
    redirect(`/dashboard/products?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/products");
}

export async function saveEmployeeAction(formData: FormData) {
  const user = await requireSession();
  const id = readString(formData, "id");

  const payload = {
    name: readString(formData, "name"),
    active: readBoolean(formData, "active"),
    title: readString(formData, "title") || null,
    assignedTruckId: readString(formData, "assignedTruckId") || null
  };

  const result = id
    ? await updateEmployee(user, id, payload)
    : await createEmployee(user, payload);

  if (!result.ok) {
    redirect(`/dashboard/employees?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/employees");
}

export async function createOrderAction(formData: FormData) {
  const user = await requireSession();
  const rawItems = readString(formData, "items");

  const items = JSON.parse(rawItems) as Array<{ productId: string; quantity: number }>;

  const result = await createOrder(user, {
    truckId: readString(formData, "truckId"),
    employeeId: readString(formData, "employeeId") || null,
    paymentMethod:
      readString(formData, "paymentMethod") === "card" ? "card" : "cash",
    items
  });

  if (!result.ok) {
    redirect(`/dashboard/pos?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/pos?success=1");
}

export async function clockInAction(formData: FormData) {
  const user = await requireSession();
  const result = await clockInEmployee(user, {
    employeeId: readString(formData, "employeeId"),
    truckId: readString(formData, "truckId")
  });

  if (!result.ok) {
    redirect(`/dashboard/time-clock?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/time-clock?success=clock-in");
}

export async function clockOutAction(formData: FormData) {
  const user = await requireSession();
  const result = await clockOutEmployee(user, {
    employeeId: readString(formData, "employeeId")
  });

  if (!result.ok) {
    redirect(`/dashboard/time-clock?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/time-clock?success=clock-out");
}

export async function editTimeEntryAction(formData: FormData) {
  const user = await requireSession();
  const result = await editTimeEntry(user, readString(formData, "id"), {
    truckId: readString(formData, "truckId"),
    clockIn: new Date(readString(formData, "clockIn")),
    clockOut: readString(formData, "clockOut")
      ? new Date(readString(formData, "clockOut"))
      : null,
    reason: readString(formData, "reason")
  });

  if (!result.ok) {
    redirect(`/dashboard/time-entries?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/time-entries?success=1");
}

export async function addPayRateAction(formData: FormData) {
  const user = await requireSession();
  const employeeId = readString(formData, "employeeId");
  const result = await addPayRate(user, {
    employeeId,
    hourlyRate: Number(readString(formData, "hourlyRate")),
    effectiveDate: new Date(readString(formData, "effectiveDate"))
  });

  if (!result.ok) {
    redirect(
      `/dashboard/employees/${employeeId}?error=${encodeURIComponent(result.error)}`
    );
  }

  redirect(`/dashboard/employees/${employeeId}?success=pay-rate`);
}

export async function generateConfigAction() {
  const user = await requireSession();
  const result = await generateNightlyConfigVersion(user);

  if (!result.ok) {
    redirect(`/dashboard/config?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/dashboard/config?success=${result.data.versionNumber}`);
}

export async function startStripeConnectAction() {
  const user = await requireSession();
  const result = await startStripeConnectFlow(user);

  if (!result.ok) {
    redirect(`/dashboard/billing?error=${encodeURIComponent(result.error)}`);
  }

  redirect(
    `/dashboard/billing?connectUrl=${encodeURIComponent(result.data.onboardingUrl)}&accountId=${encodeURIComponent(result.data.suggestedAccountId)}`
  );
}

export async function saveStripeConnectAction(formData: FormData) {
  const user = await requireSession();
  const result = await saveStripeAccountMetadata(user, {
    stripeAccountId: readString(formData, "stripeAccountId"),
    stripeConnectionStatus: readString(formData, "stripeConnectionStatus") || "connected"
  });

  if (!result.ok) {
    redirect(`/dashboard/billing?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/billing?success=connected");
}

export async function disconnectStripeAction() {
  const user = await requireSession();
  const result = await disconnectStripeAccount(user);

  if (!result.ok) {
    redirect(`/dashboard/billing?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/billing?success=disconnected");
}

export async function toggleCompanySuspensionAction(formData: FormData) {
  const user = await requireSuperAdminSession();
  const companyId = readString(formData, "companyId");
  const suspended = readString(formData, "suspended") === "true";
  const result = await setCompanySuspension(user, companyId, suspended);

  if (!result.ok) {
    redirect(`/dashboard/super-admin?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/super-admin?success=1");
}
