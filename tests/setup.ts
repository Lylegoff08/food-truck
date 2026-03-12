import { vi } from "vitest";

process.env.JWT_SECRET = "this-is-a-test-secret-12345";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.APP_URL = "http://localhost:3000";

const prismaMock = {
  company: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  },
  user: {
    findFirst: vi.fn()
  },
  truck: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  },
  product: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  },
  employee: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  },
  order: {
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  },
  auditLog: {
    create: vi.fn(),
    createMany: vi.fn()
  },
  timeEntry: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  payRate: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    createMany: vi.fn()
  },
  truckLocation: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    create: vi.fn()
  },
  truckLocationHistory: {
    findFirst: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn()
  },
  configVersion: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn()
  },
  configVersionTruck: {
    findFirst: vi.fn(),
    update: vi.fn(),
    createMany: vi.fn()
  },
  productChangeQueue: {
    create: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn()
  },
  paymentTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn()
  },
  companyWeeklyRevenue: {
    upsert: vi.fn(),
    findMany: vi.fn()
  }
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}));

export { prismaMock };
