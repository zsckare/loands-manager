CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditEvent_ownerId_createdAt_idx" ON "AuditEvent"("ownerId", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
CREATE TABLE "CashClose" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerId" UUID NOT NULL,
  "businessDate" DATE NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
  "expectedBalance" DECIMAL(18,2) NOT NULL,
  "countedBalance" DECIMAL(18,2) NOT NULL,
  "difference" DECIMAL(18,2) NOT NULL,
  "closedById" UUID NOT NULL,
  "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  CONSTRAINT "CashClose_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CashClose_ownerId_businessDate_key" ON "CashClose"("ownerId", "businessDate");

-- Enforce append-only audit events and immutable cash closes at the database level.
CREATE FUNCTION "reject_financial_record_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Financial audit and close records are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "AuditEvent_immutable" BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION "reject_financial_record_mutation"();
CREATE TRIGGER "CashClose_immutable" BEFORE UPDATE OR DELETE ON "CashClose"
FOR EACH ROW EXECUTE FUNCTION "reject_financial_record_mutation"();
