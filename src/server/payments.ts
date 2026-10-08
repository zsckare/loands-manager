import { db } from '@/lib/db';
import { cents, money } from '@/lib/money';
import { HttpError } from '@/lib/http';
/** Locks the loan row so concurrent payments cannot overpay an installment. */
export async function postPayment(ownerId: string, loanId: string, amount: string, effectiveDate: string, note: string | undefined, key: string) {
    const wanted = cents(amount);
    if (wanted <= 0n)
        throw new HttpError(400, 'Payment must be positive');
    return db.$transaction(async (tx) => {
        const existing = await tx.payment.findUnique({ where: { ownerId_idempotencyKey: { ownerId, idempotencyKey: key } }, include: { allocations: true } });
        if (existing) {
            if (existing.loanId !== loanId || cents(existing.amount.toString()) !== wanted || existing.effectiveDate.toISOString().slice(0, 10) !== effectiveDate || (existing.note ?? '') !== (note ?? ''))
                throw new HttpError(409, 'Idempotency key reused with different data');
            return existing;
        }
        const rows = await tx.$queryRaw<{
            id: string;
        }[]> `SELECT id FROM "Loan" WHERE id = ${loanId}::uuid AND "ownerId" = ${ownerId}::uuid AND status = 'ACTIVE' FOR UPDATE`;
        if (!rows.length)
            throw new HttpError(404, 'Active loan not found');
        const installments = await tx.installment.findMany({ where: { loanId }, orderBy: { number: 'asc' } });
        const outstanding = installments.reduce((a, i) => a + cents(i.amount.toString()) - cents(i.paidAmount.toString()), 0n);
        if (wanted > outstanding)
            throw new HttpError(400, 'Insufficient balance');
        const payment = await tx.payment.create({ data: { ownerId, loanId, amount, effectiveDate: new Date(`${effectiveDate}T12:00:00Z`), note, idempotencyKey: key } });
        let remaining = wanted;
        for (const installment of installments) {
            if (remaining === 0n)
                break;
            const due = cents(installment.amount.toString()) - cents(installment.paidAmount.toString());
            const applied = remaining < due ? remaining : due;
            if (applied === 0n)
                continue;
            await tx.installment.update({ where: { id: installment.id }, data: { paidAmount: { increment: money(applied) } } });
            await tx.paymentAllocation.create({ data: { paymentId: payment.id, installmentId: installment.id, amount: money(applied) } });
            remaining -= applied;
        }
        if (wanted === outstanding)
            await tx.loan.update({ where: { id: loanId }, data: { status: 'PAID_OFF' } });
        return tx.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { allocations: true } });
    }, { isolationLevel: 'Serializable', timeout: 10000 });
}
