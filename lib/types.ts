import { PaymentMethod, UserRole } from "@prisma/client";

export type SessionUser = {
  userId: string;
  companyId: string;
  email: string;
  role: UserRole;
  name: string;
  companySuspended?: boolean;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export type CartInputItem = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  truckId: string;
  employeeId?: string | null;
  paymentMethod: PaymentMethod;
  items: CartInputItem[];
  paymentPayload?: {
    paymentToken?: string | null;
    simulateFailure?: boolean;
  };
};

export type ClockInInput = {
  employeeId: string;
  truckId: string;
};

export type ClockOutInput = {
  employeeId: string;
};

export type TimeEntryEditInput = {
  clockIn: Date;
  clockOut?: Date | null;
  truckId: string;
  reason: string;
};

export type AddPayRateInput = {
  employeeId: string;
  hourlyRate: number;
  effectiveDate: Date;
};

export type LocationUpdateInput = {
  truckId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  recordedAt?: Date;
};
