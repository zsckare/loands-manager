import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { LoanForm } from "@/components/loans";
import { loanSummary } from "@/server/loans";

/** Suspense boundary for private loan data. / Límite para los datos privados de préstamos. */
export default function LoansPage() {
  return <Suspense fallback={<p>Cargando préstamos...</p>}><LoansContent /></Suspense>;
}

async function LoansContent() {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const [clients, plans, loans] = await Promise.all([
    db.client.findMany({ where: { ownerId, status: "ACTIVE" } }),
    db.loanPlan.findMany({ where: { ownerId, active: true } }),
    db.loan.findMany({ where: { ownerId }, include: { client: true, installments: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <header><h1>Préstamos</h1><p>Capital, abonos y saldos pendientes</p></header>
      <div className="columns">
        <section className="panel">
          <h2>Préstamos ({loans.length})</h2>
          <table>
            <thead><tr><th>Cliente</th><th>Total</th><th>Pendiente</th><th>Estado</th></tr></thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td><Link href={`/loans/${loan.id}`}>{loan.client.firstName} {loan.client.lastName}</Link></td>
                  <td>${loan.totalPayable.toString()}</td>
                  <td>${loanSummary(loan).outstanding}</td>
                  <td>{loan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <LoanForm
          clients={clients.map((client) => ({ id: client.id, name: `${client.firstName} ${client.lastName}` }))}
          plans={plans.map((plan) => ({ id: plan.id, name: `${plan.name} (${plan.interestRate}%)` }))}
        />
      </div>
    </>
  );
}
