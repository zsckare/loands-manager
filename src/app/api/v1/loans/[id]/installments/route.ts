import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse, HttpError } from '@/lib/http';
export async function GET(_: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    const ownerId = await owner();
    const { id } = await params;
    const loan = await db.loan.findFirst({ where: { id, ownerId } });
    if (!loan)
        throw new HttpError(404, 'Not found');
    return NextResponse.json(await db.installment.findMany({ where: { loanId: id }, orderBy: { number: 'asc' } }));
}
catch (e) {
    return errorResponse(e);
} }
