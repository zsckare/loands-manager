import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse, HttpError } from '@/lib/http';
import { loanSchema } from '@/server/schemas';
import { calculate } from '@/lib/money';
import { schedule } from '@/lib/schedule';
export async function POST(req: Request) { try {
    const ownerId = await owner();
    const input = loanSchema.parse(await req.json());
    const plan = await db.loanPlan.findFirst({ where: { id: input.planId, ownerId, active: true } });
    if (!plan)
        throw new HttpError(404, 'Plan not found');
    const result = calculate(input.principal, plan.interestRate.toString(), plan.installmentCount);
    const dates = schedule(input.startDate, plan.installmentCount, plan.frequency, plan.collectionDays);
    return NextResponse.json({ ...result, schedule: dates.map((d, i) => ({ number: i + 1, dueDate: d.toISOString().slice(0, 10), amount: result.installments[i] })) });
}
catch (e) {
    return errorResponse(e);
} }
