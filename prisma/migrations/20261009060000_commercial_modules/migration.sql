CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'COLLECTOR');
CREATE TYPE "CashEntryType" AS ENUM ('DISBURSEMENT', 'PAYMENT', 'INCOME', 'EXPENSE');
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN', ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "managerId" UUID;
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "Receipt" ("id" UUID NOT NULL, "number" SERIAL NOT NULL, "ownerId" UUID NOT NULL, "paymentId" UUID NOT NULL, "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Receipt_number_key" ON "Receipt"("number");
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");
CREATE INDEX "Receipt_ownerId_issuedAt_idx" ON "Receipt"("ownerId", "issuedAt");
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "CashEntry" ("id" UUID NOT NULL, "ownerId" UUID NOT NULL, "type" "CashEntryType" NOT NULL, "amount" DECIMAL(18,2) NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "description" TEXT NOT NULL, "loanId" UUID, "paymentId" UUID, CONSTRAINT "CashEntry_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "CashEntry_paymentId_key" ON "CashEntry"("paymentId");
CREATE INDEX "CashEntry_ownerId_occurredAt_idx" ON "CashEntry"("ownerId", "occurredAt");
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "CollectorAssignment" ("id" UUID NOT NULL, "clientId" UUID NOT NULL, "collectorId" UUID NOT NULL, "assignedById" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CollectorAssignment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "CollectorAssignment_clientId_key" ON "CollectorAssignment"("clientId");
CREATE INDEX "CollectorAssignment_collectorId_idx" ON "CollectorAssignment"("collectorId");
ALTER TABLE "CollectorAssignment" ADD CONSTRAINT "CollectorAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CollectorAssignment" ADD CONSTRAINT "CollectorAssignment_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CollectorAssignment" ADD CONSTRAINT "CollectorAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill receipts and cash ledger for historical records.
-- The unique paymentId constraint prevents duplicate cash entries.
INSERT INTO "Receipt" ("id", "ownerId", "paymentId", "issuedAt")
SELECT gen_random_uuid(), p."ownerId", p."id", p."createdAt"
FROM "Payment" p WHERE p."status" = 'POSTED';

INSERT INTO "CashEntry" ("id", "ownerId", "type", "amount", "occurredAt", "description", "loanId", "paymentId")
SELECT gen_random_uuid(), l."ownerId", 'DISBURSEMENT'::"CashEntryType", l."principal", l."startDate", 'Entrega inicial del préstamo', l."id", NULL
FROM "Loan" l WHERE l."status" <> 'CANCELLED';

INSERT INTO "CashEntry" ("id", "ownerId", "type", "amount", "occurredAt", "description", "loanId", "paymentId")
SELECT gen_random_uuid(), p."ownerId", 'PAYMENT'::"CashEntryType", p."amount", p."effectiveDate", 'Abono registrado', p."loanId", p."id"
FROM "Payment" p WHERE p."status" = 'POSTED';
