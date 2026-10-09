import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, HttpError } from '@/lib/http';
import { actor, loanScope } from '@/lib/access';
import { loanSummary } from '@/server/loans';
export async function GET(_: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    const user = await actor();
    const { id } = await params;
    const loan = await db.loan.findFirst({ where: { id, ...loanScope(user) }, include: { client: true, plan: true, installments: { orderBy: { number: 'asc' } }, payments: { orderBy: { createdAt: 'desc' } } } });
    if (!loan)
        throw new HttpError(404, 'Not found');
    return NextResponse.json({ ...loan, summary: loanSummary(loan) });
}
catch (e) {
    return errorResponse(e);
} }
