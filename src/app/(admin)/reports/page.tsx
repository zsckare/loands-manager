import { Suspense } from "react";
import { db } from "@/lib/db";
import { staff } from "@/lib/roles";
import { cents, money } from "@/lib/money";
import { loanSummary } from "@/server/loans";

export default function ReportsPage() {
  return <Suspense fallback={<p>Calculando reportes...</p>}><ReportsContent /></Suspense>;
}

async function ReportsContent() {
  const admin = await staff();
  if (admin.role !== "ADMIN") return <section className="panel"><h2>Acceso restringido</h2></section>;
  const loans = await db.loan.findMany({ where: { ownerId: admin.id }, include: { client: true, installments: true }, orderBy: { createdAt: "desc" } });
  let principal = 0n, interest = 0n, recovered = 0n, overdue = 0n, outstanding = 0n;
  for (const loan of loans) {
    if (loan.status === "CANCELLED") continue;
    const summary = loanSummary(loan);
    principal += cents(loan.principal.toString());
    interest += cents(loan.totalInterest.toString());
    recovered += cents(summary.recovered);
    overdue += cents(summary.overdue);
    outstanding += cents(summary.outstanding);
  }
  const recovery = principal + interest ? Number(recovered * 10000n / (principal + interest)) / 100 : 0;
  return <>
    <header className="header-actions"><div><h1>Reportes financieros</h1><p>Cartera, recuperación y rentabilidad contractual.</p></div><a className="action-link" href="/api/v1/reports/export">Exportar para Excel (CSV) ↓</a></header>
    <div className="metrics">
      <article className="metric"><span>Capital colocado</span><strong>${money(principal)}</strong></article>
      <article className="metric"><span>Interés pactado</span><strong>${money(interest)}</strong></article>
      <article className="metric"><span>Recuperado</span><strong>${money(recovered)}</strong></article>
      <article className="metric"><span>Cartera vencida</span><strong>${money(overdue)}</strong></article>
      <article className="metric"><span>Saldo por recuperar</span><strong>${money(outstanding)}</strong></article>
      <article className="metric"><span>Recuperación del total pactado</span><strong>{recovery.toFixed(1)}%</strong></article>
    </div>
    <section className="panel"><h2>Detalle de cartera</h2><div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Capital</th><th>Interés</th><th>Saldo</th><th>Vencido</th></tr></thead><tbody>
      {loans.filter((l) => l.status !== "CANCELLED").map((loan) => { const summary = loanSummary(loan); return <tr key={loan.id}><td>{loan.client.firstName} {loan.client.lastName}</td><td>${loan.principal.toFixed(2)}</td><td>${loan.totalInterest.toFixed(2)}</td><td>${summary.outstanding}</td><td>${summary.overdue}</td></tr>; })}
    </tbody></table></div></section>
    <p className="hint">El interés mostrado es el pactado, no utilidad neta realizada. No incluye costos operativos ni impuestos. Los vencimientos se calculan con la convención UTC existente.</p>
  </>;
}
