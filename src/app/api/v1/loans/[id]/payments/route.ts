import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, HttpError } from '@/lib/http';
import { actor, authorize, accessibleLoan, portfolioOwner } from '@/lib/access';
import { paymentSchema } from '@/server/schemas';
import { postPayment } from '@/server/payments';
type C = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_: Request, { params }: C) { try {
    const user = await actor();
    const { id } = await params;
    await accessibleLoan(user, id);
    const ownerId = portfolioOwner(user);
    return NextResponse.json(await db.payment.findMany({ where: { loanId: id, ownerId }, include: { allocations: true }, orderBy: { createdAt: 'desc' } }));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request, { params }: C) { try {
    const user = await actor();
    authorize(user, "collect");
    const ownerId = portfolioOwner(user);
    const { id } = await params;
    await accessibleLoan(user, id);
    const key = req.headers.get('idempotency-key');
    if (!key || key.length > 100)
        throw new HttpError(400, 'Idempotency-Key required');
    const input = paymentSchema.parse(await req.json());
    return NextResponse.json(await postPayment(ownerId, id, input.amount, input.effectiveDate, input.note, key, user.id), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
