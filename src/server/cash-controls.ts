import type { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/lib/http";

export const BUSINESS_TIMEZONE = "America/Mexico_City";

/** Local business date independent of the deployment server's timezone. */
export function businessDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

/** Use a shared owner-row lock to serialize close and financial postings. */
export async function lockAndCheckCashDay(
  tx: Prisma.TransactionClient,
  ownerId: string,
  occurredAt: Date,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${ownerId}::uuid FOR UPDATE`;
  const day = businessDate(occurredAt);
  const closed = await tx.cashClose.findFirst({
    // Never backdate a posting into an already reconciled accounting period.
    where: { ownerId, businessDate: { gte: new Date(`${day}T00:00:00Z`) } },
    select: { id: true },
  });
  if (closed) throw new HttpError(409, `Cash is closed for ${day}`);
}

/** Ledger signs: payments and income are positive; expenses and disbursements negative. */
export function signedAmount(type: string, amount: bigint): bigint {
  return type === "DISBURSEMENT" || type === "EXPENSE" ? -amount : amount;
}
