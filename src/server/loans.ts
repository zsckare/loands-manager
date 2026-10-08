import { db } from '@/lib/db';
import { calculate, cents, money } from '@/lib/money';
import { schedule } from '@/lib/schedule';
import { HttpError } from '@/lib/http';
import type { z } from 'zod';
import type { loanSchema } from './schemas';
export async function createLoan(ownerId: string, input: z.infer<typeof loanSchema>) {
    const [client, plan] = await Promise.all([db.client.findFirst({ where: { id: input.clientId, ownerId, status: 'ACTIVE' } }), db.loanPlan.findFirst({ where: { id: input.planId, ownerId, active: true } })]);
    if (!client || !plan)
        throw new HttpError(404, 'Client or plan not found');
    const result = calculate(input.principal, plan.interestRate.toString(), plan.installmentCount);
    const dates = schedule(input.startDate, plan.installmentCount, plan.frequency, plan.collectionDays);
    return db.loan.create({ data: { ownerId, clientId: client.id, planId: plan.id, principal: input.principal, interestRate: plan.interestRate, totalInterest: result.interest, totalPayable: result.total, installmentCount: plan.installmentCount, frequency: plan.frequency, collectionDays: plan.collectionDays, startDate: new Date(`${input.startDate}T12:00:00Z`), installments: { create: dates.map((date, i) => ({ number: i + 1, dueDate: date, amount: result.installments[i] })) } }, include: { installments: { orderBy: { number: 'asc' } }, client: true } });
}
export function loanSummary<T extends {
    totalPayable: {
        toString(): string;
    };
    installments: {
        amount: {
            toString(): string;
        };
        paidAmount: {
            toString(): string;
        };
        dueDate: Date;
    }[];
}>(loan: T) {
    const total = cents(loan.totalPayable.toString());
    const recovered = loan.installments.reduce((a, i) => a + cents(i.paidAmount.toString()), 0n);
    const today = new Date().toISOString().slice(0, 10);
    const overdue = loan.installments.filter(i => i.dueDate.toISOString().slice(0, 10) < today).reduce((a, i) => a + cents(i.amount.toString()) - cents(i.paidAmount.toString()), 0n);
    return { total: money(total), recovered: money(recovered), outstanding: money(total - recovered), overdue: money(overdue) };
}
