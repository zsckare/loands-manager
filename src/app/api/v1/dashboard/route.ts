import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/http';
import { actor, loanScope } from '@/lib/access';
import { loanSummary } from '@/server/loans';
import { cents, money } from '@/lib/money';
export async function GET() { try {
    const user = await actor();
    const loans = await db.loan.findMany({ where: loanScope(user), include: { client: true, installments: true } });
    let recovered = 0n, outstanding = 0n, overdue = 0n, active = 0, late = 0;
    const overdueLoans = [];
    for (const loan of loans) {
        if (loan.status === 'CANCELLED')
            continue;
        const s = loanSummary(loan);
        recovered += cents(s.recovered);
        outstanding += cents(s.outstanding);
        overdue += cents(s.overdue);
        if (loan.status === 'ACTIVE')
            active++;
        if (cents(s.overdue) > 0n) {
            late++;
            overdueLoans.push({ id: loan.id, client: `${loan.client.firstName} ${loan.client.lastName}`, overdue: s.overdue });
        }
    }
    return NextResponse.json({ activeLoans: active, lateLoans: late, recovered: money(recovered), outstanding: money(outstanding), overdue: money(overdue), overdueLoans });
}
catch (e) {
    return errorResponse(e);
} }
