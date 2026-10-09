import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { cents, money } from "@/lib/money";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/roles";
import { BUSINESS_TIMEZONE, businessDate, signedAmount } from "@/server/cash-controls";

const schema = z.object({
  countedBalance: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  note: z.string().max(300).optional(),
});

/** Read past closures, without modifying immutable accounting records. */
export async function GET() {
  try {
    const admin = await requireAdmin();
    const closes = await db.cashClose.findMany({
      where: { ownerId: admin.id }, orderBy: { businessDate: "desc" }, take: 90,
    });
    return NextResponse.json(closes);
  } catch (error) { return errorResponse(error); }
}

/** Close today under a database row lock to avoid racing with postings. */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = schema.parse(await request.json());
    const close = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${admin.id}::uuid FOR UPDATE`;
      const now = new Date();
      const date = businessDate(now);
      const businessDateValue = new Date(`${date}T00:00:00Z`);
      const existing = await tx.cashClose.findUnique({
        where: { ownerId_businessDate: { ownerId: admin.id, businessDate: businessDateValue } },
      });
      if (existing) throw new HttpError(409, "Cash already closed today");
      // Closing balance is the entire recorded ledger through this instant.
      // Balance de cierre: libro acumulado hasta el momento del cierre.
      const entries = await tx.cashEntry.findMany({
        where: { ownerId: admin.id, occurredAt: { lte: now } },
        select: { type: true, amount: true },
      });
      const expected = entries.reduce((sum, entry) =>
        sum + signedAmount(entry.type, cents(entry.amount.toString())), 0n);
      const counted = cents(input.countedBalance);
      const result = await tx.cashClose.create({ data: {
        ownerId: admin.id, businessDate: businessDateValue, timezone: BUSINESS_TIMEZONE,
        expectedBalance: money(expected), countedBalance: money(counted),
        difference: money(counted - expected), closedById: admin.id, note: input.note,
      } });
      await tx.auditEvent.create({ data: {
        ownerId: admin.id, actorId: admin.id, action: "CASH_CLOSED",
        entityType: "CashClose", entityId: result.id,
        details: { date, expected: money(expected), counted: money(counted) },
      } });
      return result;
    }, { isolationLevel: "Serializable", timeout: 20000 });
    return NextResponse.json(close, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
