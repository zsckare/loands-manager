import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/http';
import { actor, loanScope } from '@/lib/access';
export async function GET() { try {
    const user = await actor();
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    const rows = await db.installment.findMany({ where: { dueDate: { lt: today }, loan: { ...loanScope(user), status: 'ACTIVE' } }, include: { loan: { include: { client: true } } }, orderBy: { dueDate: 'asc' } });
    return NextResponse.json(rows.filter(i => i.paidAmount.lt(i.amount)).map(i => ({ id: i.id, loanId: i.loanId, client: `${i.loan.client.firstName} ${i.loan.client.lastName}`, dueDate: i.dueDate, amount: i.amount.toString(), paid: i.paidAmount.toString(), remaining: i.amount.minus(i.paidAmount).toString() })));
}
catch (e) {
    return errorResponse(e);
} }
