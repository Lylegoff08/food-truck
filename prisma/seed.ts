import {
  ConfigTruckStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentTransactionStatus,
  PrismaClient,
  ProductChangeAction,
  TimeEntryStatus,
  UserRole
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const slugs = ["demo-company", "second-demo", "platform-admin"];

  for (const slug of slugs) {
    const existing = await prisma.company.findUnique({
      where: { slug }
    });

    if (existing) {
      await prisma.auditLog.deleteMany({ where: { companyId: existing.id } });
      await prisma.companyWeeklyRevenue.deleteMany({ where: { companyId: existing.id } });
      await prisma.paymentTransaction.deleteMany({ where: { companyId: existing.id } });
      await prisma.productChangeQueue.deleteMany({ where: { companyId: existing.id } });
      await prisma.configVersionTruck.deleteMany({ where: { companyId: existing.id } });
      await prisma.configVersion.deleteMany({ where: { companyId: existing.id } });
      await prisma.truckLocationHistory.deleteMany({ where: { companyId: existing.id } });
      await prisma.truckLocation.deleteMany({ where: { companyId: existing.id } });
      await prisma.payRate.deleteMany({ where: { companyId: existing.id } });
      await prisma.timeEntry.deleteMany({ where: { companyId: existing.id } });
      await prisma.orderItem.deleteMany({ where: { companyId: existing.id } });
      await prisma.order.deleteMany({ where: { companyId: existing.id } });
      await prisma.employee.deleteMany({ where: { companyId: existing.id } });
      await prisma.product.deleteMany({ where: { companyId: existing.id } });
      await prisma.truck.deleteMany({ where: { companyId: existing.id } });
      await prisma.user.deleteMany({ where: { companyId: existing.id } });
      await prisma.company.delete({ where: { id: existing.id } });
    }
  }

  const passwordHash = await hashPassword("password123");

  const company = await prisma.company.create({
    data: {
      name: "Demo Company",
      slug: "demo-company",
      stripeAccountId: "acct_demo_company",
      stripeConnected: true,
      stripeConnectionStatus: "connected",
      users: {
        create: [
          {
            name: "Demo Owner",
            email: "owner@demo.com",
            passwordHash,
            role: UserRole.owner
          },
          {
            name: "Demo Manager",
            email: "manager@demo.com",
            passwordHash,
            role: UserRole.manager
          }
        ]
      }
    }
  });

  const [truckA, truckB] = await Promise.all([
    prisma.truck.create({
      data: {
        companyId: company.id,
        name: "Downtown Truck",
        active: true
      }
    }),
    prisma.truck.create({
      data: {
        companyId: company.id,
        name: "Events Truck",
        active: true
      }
    })
  ]);

  const [employeeA] = await Promise.all([
    prisma.employee.create({
      data: {
        companyId: company.id,
        name: "Casey Cashier",
        active: true,
        title: "Cashier",
        assignedTruckId: truckA.id
      }
    }),
    prisma.employee.create({
      data: {
        companyId: company.id,
        name: "Morgan Manager",
        active: true,
        title: "Manager",
        assignedTruckId: truckB.id
      }
    })
  ]);

  const taco = await prisma.product.create({
    data: {
      companyId: company.id,
      name: "Street Taco",
      category: "Food",
      price: 4.5,
      active: true,
      archived: false
    }
  });

  const soda = await prisma.product.create({
    data: {
      companyId: company.id,
      name: "Soda",
      category: "Drink",
      price: 2.25,
      active: true,
      archived: false
    }
  });

  await prisma.product.create({
    data: {
      companyId: company.id,
      name: "Old Special",
      category: "Food",
      price: 9.99,
      active: false,
      archived: true
    }
  });

  const paidOrder = await prisma.order.create({
    data: {
      companyId: company.id,
      truckId: truckA.id,
      employeeId: employeeA.id,
      paymentMethod: PaymentMethod.card,
      paymentStatus: "paid",
      subtotal: 11.25,
      paidAt: new Date("2026-03-10T19:00:00.000Z"),
      items: {
        create: [
          {
            companyId: company.id,
            productId: taco.id,
            productNameAtSale: "Street Taco",
            unitPriceAtSale: 4.5,
            quantity: 2,
            lineTotalAtSale: 9
          },
          {
            companyId: company.id,
            productId: soda.id,
            productNameAtSale: "Soda",
            unitPriceAtSale: 2.25,
            quantity: 1,
            lineTotalAtSale: 2.25
          }
        ]
      }
    }
  });

  await prisma.paymentTransaction.create({
    data: {
      companyId: company.id,
      orderId: paidOrder.id,
      provider: PaymentProvider.stripe_connect_mock,
      providerTransactionId: "pi_seed_demo",
      amount: 11.25,
      status: PaymentTransactionStatus.succeeded,
      rawResponse: {
        connectedAccountId: "acct_demo_company"
      }
    }
  });

  await prisma.payRate.createMany({
    data: [
      {
        companyId: company.id,
        employeeId: employeeA.id,
        hourlyRate: 16.5,
        effectiveDate: new Date("2026-01-01T08:00:00.000Z")
      },
      {
        companyId: company.id,
        employeeId: employeeA.id,
        hourlyRate: 18,
        effectiveDate: new Date("2026-03-01T08:00:00.000Z")
      }
    ]
  });

  const openTimeEntry = await prisma.timeEntry.create({
    data: {
      companyId: company.id,
      employeeId: employeeA.id,
      truckId: truckA.id,
      clockIn: new Date(),
      status: TimeEntryStatus.clocked_in
    }
  });

  await prisma.truckLocation.create({
    data: {
      truckId: truckA.id,
      companyId: company.id,
      latitude: 34.052235,
      longitude: -118.243683,
      speed: 0,
      heading: 0,
      recordedAt: new Date()
    }
  });

  await prisma.truckLocationHistory.create({
    data: {
      truckId: truckA.id,
      companyId: company.id,
      latitude: 34.052235,
      longitude: -118.243683,
      speed: 0,
      heading: 0,
      recordedAt: new Date()
    }
  });

  const configVersion = await prisma.configVersion.create({
    data: {
      companyId: company.id,
      versionNumber: 1,
      releaseDate: new Date("2026-03-12T10:00:00.000Z"),
      bundleJson: {
        companyId: company.id,
        versionNumber: 1,
        products: [
          { name: "Street Taco", price: 4.5 },
          { name: "Soda", price: 2.25 }
        ]
      }
    }
  });

  await prisma.configVersionTruck.createMany({
    data: [
      {
        companyId: company.id,
        configVersionId: configVersion.id,
        truckId: truckA.id,
        status: ConfigTruckStatus.pending
      },
      {
        companyId: company.id,
        configVersionId: configVersion.id,
        truckId: truckB.id,
        status: ConfigTruckStatus.applied,
        acknowledgedAt: new Date()
      }
    ]
  });

  await prisma.productChangeQueue.create({
    data: {
      companyId: company.id,
      productId: taco.id,
      action: ProductChangeAction.updated,
      changedFields: {
        price: {
          from: 4.25,
          to: 4.5
        }
      },
      includedInConfigVersionId: configVersion.id
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        actorUserId: null,
        action: "seed.created",
        entityType: "Company",
        entityId: company.id,
        details: {}
      },
      {
        companyId: company.id,
        actorUserId: null,
        action: "time_entry.clock_in",
        entityType: "TimeEntry",
        entityId: openTimeEntry.id,
        details: {}
      }
    ]
  });

  await prisma.companyWeeklyRevenue.create({
    data: {
      companyId: company.id,
      weekStart: new Date("2026-03-10T00:00:00.000Z"),
      grossSales: 11.25,
      thresholdMet: false,
      platformFeeDue: 0
    }
  });

  const secondCompany = await prisma.company.create({
    data: {
      name: "Second Demo Company",
      slug: "second-demo",
      stripeConnected: false,
      users: {
        create: {
          name: "Second Owner",
          email: "second@demo.com",
          passwordHash,
          role: UserRole.owner
        }
      }
    }
  });

  await prisma.companyWeeklyRevenue.create({
    data: {
      companyId: secondCompany.id,
      weekStart: new Date("2026-03-10T00:00:00.000Z"),
      grossSales: 650,
      thresholdMet: true,
      platformFeeDue: 19.5
    }
  });

  await prisma.company.create({
    data: {
      name: "Platform Admin",
      slug: "platform-admin",
      users: {
        create: {
          name: "Super Admin",
          email: "super@demo.com",
          passwordHash,
          role: UserRole.super_admin
        }
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
