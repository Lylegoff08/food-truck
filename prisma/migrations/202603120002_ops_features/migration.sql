CREATE TYPE "TimeEntryStatus" AS ENUM ('clocked_in', 'clocked_out', 'edited');
CREATE TYPE "ConfigTruckStatus" AS ENUM ('pending', 'applied', 'failed');
CREATE TYPE "ProductChangeAction" AS ENUM ('created', 'updated', 'archived');

CREATE TABLE "TimeEntry" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "truckId" TEXT NOT NULL,
  "clockIn" TIMESTAMP(3) NOT NULL,
  "clockOut" TIMESTAMP(3),
  "status" "TimeEntryStatus" NOT NULL,
  "editedByUserId" TEXT,
  "editReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayRate" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "hourlyRate" DECIMAL(10,2) NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TruckLocation" (
  "truckId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "latitude" DECIMAL(10,6) NOT NULL,
  "longitude" DECIMAL(10,6) NOT NULL,
  "speed" DECIMAL(10,2),
  "heading" DECIMAL(10,2),
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TruckLocation_pkey" PRIMARY KEY ("truckId")
);

CREATE TABLE "TruckLocationHistory" (
  "id" TEXT NOT NULL,
  "truckId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "latitude" DECIMAL(10,6) NOT NULL,
  "longitude" DECIMAL(10,6) NOT NULL,
  "speed" DECIMAL(10,2),
  "heading" DECIMAL(10,2),
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TruckLocationHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConfigVersion" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releaseDate" TIMESTAMP(3) NOT NULL,
  "bundleJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConfigVersionTruck" (
  "id" TEXT NOT NULL,
  "configVersionId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "truckId" TEXT NOT NULL,
  "status" "ConfigTruckStatus" NOT NULL DEFAULT 'pending',
  "acknowledgedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConfigVersionTruck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductChangeQueue" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "action" "ProductChangeAction" NOT NULL,
  "changedFields" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "includedInConfigVersionId" TEXT,
  CONSTRAINT "ProductChangeQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TimeEntry_companyId_idx" ON "TimeEntry"("companyId");
CREATE INDEX "TimeEntry_companyId_employeeId_clockOut_idx" ON "TimeEntry"("companyId", "employeeId", "clockOut");
CREATE INDEX "TimeEntry_truckId_idx" ON "TimeEntry"("truckId");
CREATE INDEX "PayRate_companyId_idx" ON "PayRate"("companyId");
CREATE INDEX "PayRate_companyId_employeeId_effectiveDate_idx" ON "PayRate"("companyId", "employeeId", "effectiveDate");
CREATE INDEX "TruckLocation_companyId_idx" ON "TruckLocation"("companyId");
CREATE INDEX "TruckLocationHistory_companyId_idx" ON "TruckLocationHistory"("companyId");
CREATE INDEX "TruckLocationHistory_truckId_recordedAt_idx" ON "TruckLocationHistory"("truckId", "recordedAt");
CREATE UNIQUE INDEX "ConfigVersion_companyId_versionNumber_key" ON "ConfigVersion"("companyId", "versionNumber");
CREATE INDEX "ConfigVersion_companyId_generatedAt_idx" ON "ConfigVersion"("companyId", "generatedAt");
CREATE UNIQUE INDEX "ConfigVersionTruck_configVersionId_truckId_key" ON "ConfigVersionTruck"("configVersionId", "truckId");
CREATE INDEX "ConfigVersionTruck_companyId_truckId_idx" ON "ConfigVersionTruck"("companyId", "truckId");
CREATE INDEX "ProductChangeQueue_companyId_createdAt_idx" ON "ProductChangeQueue"("companyId", "createdAt");
CREATE INDEX "ProductChangeQueue_companyId_includedInConfigVersionId_idx" ON "ProductChangeQueue"("companyId", "includedInConfigVersionId");
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayRate" ADD CONSTRAINT "PayRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayRate" ADD CONSTRAINT "PayRate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TruckLocation" ADD CONSTRAINT "TruckLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TruckLocation" ADD CONSTRAINT "TruckLocation_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TruckLocationHistory" ADD CONSTRAINT "TruckLocationHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TruckLocationHistory" ADD CONSTRAINT "TruckLocationHistory_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConfigVersion" ADD CONSTRAINT "ConfigVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConfigVersionTruck" ADD CONSTRAINT "ConfigVersionTruck_configVersionId_fkey" FOREIGN KEY ("configVersionId") REFERENCES "ConfigVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConfigVersionTruck" ADD CONSTRAINT "ConfigVersionTruck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConfigVersionTruck" ADD CONSTRAINT "ConfigVersionTruck_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductChangeQueue" ADD CONSTRAINT "ProductChangeQueue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductChangeQueue" ADD CONSTRAINT "ProductChangeQueue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductChangeQueue" ADD CONSTRAINT "ProductChangeQueue_includedInConfigVersionId_fkey" FOREIGN KEY ("includedInConfigVersionId") REFERENCES "ConfigVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
