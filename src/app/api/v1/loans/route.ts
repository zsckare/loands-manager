import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse } from '@/lib/http';
import { loanSchema } from '@/server/schemas';
import { createLoan, loanSummary } from '@/server/loans';
export async function GET() { try {
    const ownerId = await owner();
    const loans = await db.loan.findMany({ where: { ownerId }, include: { client: true, plan: true, installments: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(loans.map(l => ({ ...l, summary: loanSummary(l) })));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request) { try {
    const ownerId = await owner();
    const input = loanSchema.parse(await req.json());
    return NextResponse.json(await createLoan(ownerId, input), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
