import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/http';
import { actor, authorize, loanScope, portfolioOwner } from '@/lib/access';
import { loanSchema } from '@/server/schemas';
import { createLoan, loanSummary } from '@/server/loans';
export async function GET() { try {
    const user = await actor();
    const loans = await db.loan.findMany({ where: loanScope(user), include: { client: true, plan: true, installments: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(loans.map(l => ({ ...l, summary: loanSummary(l) })));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request) { try {
    const user = await actor();
    authorize(user, "createLoan");
    const ownerId = portfolioOwner(user);
    const input = loanSchema.parse(await req.json());
    return NextResponse.json(await createLoan(ownerId, input, user.id), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
