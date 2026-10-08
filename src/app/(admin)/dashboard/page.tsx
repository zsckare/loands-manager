import Link from 'next/link';
import { db } from '@/lib/db';
import { currentUserId } from '@/lib/auth';
import { loanSummary } from '@/server/loans';
import { cents, money } from '@/lib/money';
export default async function Dashboard() { const ownerId = (await currentUserId())!; const loans = await db.loan.findMany({ where: { ownerId }, include: { client: true, installments: true } }); let recovered = 0n, outstanding = 0n, overdue = 0n, active = 0; const late: {
    id: string;
    name: string;
    overdue: string;
}[] = []; for (const l of loans) {
    if (l.status === 'CANCELLED')
        continue;
    const s = loanSummary(l);
    recovered += cents(s.recovered);
    outstanding += cents(s.outstanding);
    overdue += cents(s.overdue);
    if (l.status === 'ACTIVE')
        active++;
    if (cents(s.overdue) > 0n)
        late.push({ id: l.id, name: `${l.client.firstName} ${l.client.lastName}`, overdue: s.overdue });
} return <><header><h1>Dashboard</h1><p>Resumen de tu cartera de préstamos</p></header><div className="metrics"><article className="metric"><span>Préstamos activos</span><strong>{active}</strong></article><article className="metric"><span>Dinero recuperado</span><strong>${money(recovered)}</strong></article><article className="metric"><span>Total pendiente</span><strong>${money(outstanding)}</strong></article><article className="metric"><span>Saldo vencido</span><strong>${money(overdue)}</strong></article></div><section className="panel"><h2>Préstamos con atrasos ({late.length})</h2><table><thead><tr><th>Cliente</th><th>Saldo vencido</th><th>Acción</th></tr></thead><tbody>{late.map(l => <tr key={l.id}><td>{l.name}</td><td>${l.overdue}</td><td><Link href={`/loans/${l.id}`}>Ver préstamo →</Link></td></tr>)}</tbody></table></section></>; }
