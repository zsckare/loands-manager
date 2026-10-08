import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse, HttpError } from '@/lib/http';
import { paymentSchema } from '@/server/schemas';
import { postPayment } from '@/server/payments';
type C = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_: Request, { params }: C) { try {
    const ownerId = await owner();
    const { id } = await params;
    const loan = await db.loan.findFirst({ where: { id, ownerId } });
    if (!loan)
        throw new HttpError(404, 'Not found');
    return NextResponse.json(await db.payment.findMany({ where: { loanId: id, ownerId }, include: { allocations: true }, orderBy: { createdAt: 'desc' } }));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request, { params }: C) { try {
    const ownerId = await owner();
    const { id } = await params;
    const key = req.headers.get('idempotency-key');
    if (!key || key.length > 100)
        throw new HttpError(400, 'Idempotency-Key required');
    const input = paymentSchema.parse(await req.json());
    return NextResponse.json(await postPayment(ownerId, id, input.amount, input.effectiveDate, input.note, key), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
