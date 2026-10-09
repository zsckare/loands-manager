import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { cents } from "@/lib/money";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/roles";
import { lockAndCheckCashDay } from "@/server/cash-controls";

const entrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  description: z.string().trim().min(3).max(240),
});

export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    const day = new URL(request.url).searchParams.get("day");
    const where = { ownerId: user.id, ...(day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? {
      occurredAt: { gte: new Date(`${day}T00:00:00Z`), lt: new Date(new Date(`${day}T00:00:00Z`).getTime() + 86400000) },
    } : {}) };
    const entries = await db.cashEntry.findMany({ where, orderBy: { occurredAt: "desc" }, take: 500 });
    return NextResponse.json(entries);
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const input = entrySchema.parse(await request.json());
    if (cents(input.amount) <= 0n) throw new HttpError(400, "Amount must be positive");
    const entry = await db.$transaction(async (tx) => {
      const occurredAt = new Date();
      await lockAndCheckCashDay(tx, user.id, occurredAt);
      const created = await tx.cashEntry.create({ data: { ...input, ownerId: user.id, occurredAt } });
      await tx.auditEvent.create({ data: {
        ownerId: user.id, actorId: user.id, action: "CASH_ENTRY_CREATED",
        entityType: "CashEntry", entityId: created.id,
        details: { type: input.type, amount: input.amount },
      } });
      return created;
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
