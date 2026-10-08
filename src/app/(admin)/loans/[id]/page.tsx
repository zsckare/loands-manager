import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUserId } from '@/lib/auth';
import { loanSummary } from '@/server/loans';
import { PaymentForm } from '@/components/loans';
export default async function Detail({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const ownerId = (await currentUserId())!; const { id } = await params; const l = await db.loan.findFirst({ where: { id, ownerId }, include: { client: true, plan: true, installments: { orderBy: { number: 'asc' } }, payments: { orderBy: { createdAt: 'desc' } } } }); if (!l)
    notFound(); const s = loanSummary(l); const today = new Date().toISOString().slice(0, 10); return <><header><h1>Préstamo de {l.client.firstName} {l.client.lastName}</h1><p>{l.plan.name} · {l.status}</p></header><div className="metrics"><article className="metric"><span>Total</span><strong>${s.total}</strong></article><article className="metric"><span>Recuperado</span><strong>${s.recovered}</strong></article><article className="metric"><span>Pendiente</span><strong>${s.outstanding}</strong></article><article className="metric"><span>Vencido</span><strong>${s.overdue}</strong></article></div><div className="columns"><section className="panel"><h2>Calendario de abonos</h2><table><thead><tr><th>#</th><th>Fecha</th><th>Cuota</th><th>Pagado</th><th>Estado</th></tr></thead><tbody>{l.installments.map(i => { const paid = i.paidAmount.gte(i.amount); const late = i.dueDate.toISOString().slice(0, 10) < today; return <tr key={i.id}><td>{i.number}</td><td>{i.dueDate.toISOString().slice(0, 10)}</td><td>${i.amount.toString()}</td><td>${i.paidAmount.toString()}</td><td><span className={paid ? 'ok' : late ? 'error' : ''}>{paid ? 'Pagado' : late ? 'Atrasado' : i.paidAmount.gt(0) ? 'Parcial' : 'Pendiente'}</span></td></tr>; })}</tbody></table></section><div><PaymentForm loanId={id}/><section className="panel"><h2>Últimos pagos</h2>{l.payments.map(p => <p key={p.id}>${p.amount.toString()} · {p.effectiveDate.toISOString().slice(0, 10)}</p>)}</section></div></div></>; }
