import { db } from '@/lib/db';
import { cents, money } from '@/lib/money';
import { HttpError } from '@/lib/http';
import { lockAndCheckCashDay } from '@/server/cash-controls';
import { allocateOldest } from '@/lib/allocation';
/** Locks the loan row so concurrent payments cannot overpay an installment. */
export async function postPayment(ownerId: string, loanId: string, amount: string, effectiveDate: string, note: string | undefined, key: string, actorId = ownerId) {
    const wanted = cents(amount);
    if (wanted <= 0n)
        throw new HttpError(400, 'Payment must be positive');
    return db.$transaction(async (tx) => {
        // Serialize retries before reading the idempotency record.
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${ownerId}::uuid FOR UPDATE`;
        const existing = await tx.payment.findUnique({ where: { ownerId_idempotencyKey: { ownerId, idempotencyKey: key } }, include: { allocations: true } });
        if (existing) {
            if (existing.loanId !== loanId || cents(existing.amount.toString()) !== wanted || existing.effectiveDate.toISOString().slice(0, 10) !== effectiveDate || (existing.note ?? '') !== (note ?? ''))
                throw new HttpError(409, 'Idempotency key reused with different data');
            return existing;
        }
        await lockAndCheckCashDay(tx, ownerId, new Date(`${effectiveDate}T12:00:00Z`));
        const rows = await tx.$queryRaw<{
            id: string;
            clientId: string;
        }[]> `SELECT id, "clientId" FROM "Loan" WHERE id = ${loanId}::uuid AND "ownerId" = ${ownerId}::uuid AND status = 'ACTIVE' FOR UPDATE`;
        if (!rows.length)
            throw new HttpError(404, 'Active loan not found');
        // Recheck staff assignment inside the same transaction.
        // Revalida la asignación del cobrador al confirmar el pago.
        if (actorId !== ownerId) {
            const staffMember = await tx.user.findFirst({
                where: { id: actorId, managerId: ownerId, active: true },
                select: { role: true },
            });
            if (!staffMember) throw new HttpError(403, 'Inactive or unauthorized staff');
            if (staffMember.role === 'COLLECTOR') {
                const assignment = await tx.collectorAssignment.findFirst({
                    where: { collectorId: actorId, clientId: rows[0].clientId },
                    select: { id: true },
                });
                if (!assignment) throw new HttpError(403, 'Client not assigned to collector');
            }
        }
        const installments = await tx.installment.findMany({ where: { loanId }, orderBy: { number: 'asc' } });
        const outstanding = installments.reduce((a, i) => a + cents(i.amount.toString()) - cents(i.paidAmount.toString()), 0n);
        if (wanted > outstanding)
            throw new HttpError(400, 'Insufficient balance');
        const payment = await tx.payment.create({ data: { ownerId, loanId, amount, effectiveDate: new Date(`${effectiveDate}T12:00:00Z`), note, idempotencyKey: key } });
        const allocations = allocateOldest(
            installments.map((installment) => cents(installment.amount.toString()) - cents(installment.paidAmount.toString())),
            wanted,
        );
        for (const [index, installment] of installments.entries()) {
            const applied = allocations[index];
            if (applied === 0n) continue;
            await tx.installment.update({ where: { id: installment.id }, data: { paidAmount: { increment: money(applied) } } });
            await tx.paymentAllocation.create({ data: { paymentId: payment.id, installmentId: installment.id, amount: money(applied) } });
        }
        // Create receipt and cash ledger entry atomically with the payment.
        await tx.receipt.create({ data: { ownerId, paymentId: payment.id } });
        await tx.cashEntry.create({
            data: {
                ownerId,
                paymentId: payment.id,
                loanId,
                type: 'PAYMENT',
                amount,
                description: `Abono de préstamo ${loanId}`,
                occurredAt: new Date(`${effectiveDate}T12:00:00Z`),
            },
        });
        if (wanted === outstanding)
            await tx.loan.update({ where: { id: loanId }, data: { status: 'PAID_OFF' } });
        await tx.auditEvent.create({ data: { ownerId, actorId, action: "PAYMENT_POSTED", entityType: "Payment", entityId: payment.id, details: { loanId, amount, effectiveDate } } });
        return tx.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { allocations: true } });
    }, { isolationLevel: 'Serializable', timeout: 10000 });
}
