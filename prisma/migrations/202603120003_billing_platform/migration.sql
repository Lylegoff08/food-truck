CREATE TYPE "OrderPaymentStatus" AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE "PaymentProvider" AS ENUM ('manual_cash', 'stripe_connect_mock');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('pending', 'succeeded', 'failed');

ALTER TABLE "Company"
  ADD COLUMN "stripeAccountId" TEXT,
  ADD COLUMN "stripeConnected" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stripeConnectionStatus" TEXT,
  ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "providerTransactionId" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "PaymentTransactionStatus" NOT NULL,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyWeeklyRevenue" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "grossSales" DECIMAL(10,2) NOT NULL,
  "thresholdMet" BOOLEAN NOT NULL,
  "platformFeeDue" DECIMAL(10,2) NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyWeeklyRevenue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentTransaction_companyId_idx" ON "PaymentTransaction"("companyId");
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");
CREATE UNIQUE INDEX "CompanyWeeklyRevenue_companyId_weekStart_key" ON "CompanyWeeklyRevenue"("companyId", "weekStart");
CREATE INDEX "CompanyWeeklyRevenue_companyId_weekStart_idx" ON "CompanyWeeklyRevenue"("companyId", "weekStart");

ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyWeeklyRevenue" ADD CONSTRAINT "CompanyWeeklyRevenue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
