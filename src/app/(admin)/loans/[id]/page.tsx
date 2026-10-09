import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { loanSummary } from "@/server/loans";
import { PaymentForm } from "@/components/loans";

type DetailProps = { params: Promise<{ id: string }> };

/** Defers dynamic route params and session reads. / Difiere los parámetros y la sesión. */
export default function LoanDetailPage({ params }: DetailProps) {
  return <Suspense fallback={<p>Cargando detalle del préstamo...</p>}><LoanDetailContent params={params} /></Suspense>;
}

async function LoanDetailContent({ params }: DetailProps) {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const { id } = await params;
  const loan = await db.loan.findFirst({
    where: { id, ownerId },
    include: {
      client: true,
      plan: true,
      installments: { orderBy: { number: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, include: { receipt: true } },
    },
  });
  if (!loan) notFound();
  const summary = loanSummary(loan);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <header>
        <h1>Préstamo de {loan.client.firstName} {loan.client.lastName}</h1>
        <p>{loan.plan.name} · {loan.status}</p>
      </header>
      <div className="metrics">
        <article className="metric"><span>Total</span><strong>${summary.total}</strong></article>
        <article className="metric"><span>Recuperado</span><strong>${summary.recovered}</strong></article>
        <article className="metric"><span>Pendiente</span><strong>${summary.outstanding}</strong></article>
        <article className="metric"><span>Vencido</span><strong>${summary.overdue}</strong></article>
      </div>
      <div className="columns">
        <section className="panel">
          <h2>Calendario de abonos</h2>
          <table>
            <thead><tr><th>#</th><th>Fecha</th><th>Cuota</th><th>Pagado</th><th>Estado</th></tr></thead>
            <tbody>
              {loan.installments.map((installment) => {
                const paid = installment.paidAmount.gte(installment.amount);
                const late = installment.dueDate.toISOString().slice(0, 10) < today;
                return (
                  <tr key={installment.id}>
                    <td>{installment.number}</td>
                    <td>{installment.dueDate.toISOString().slice(0, 10)}</td>
                    <td>${installment.amount.toString()}</td>
                    <td>${installment.paidAmount.toString()}</td>
                    <td>
                      <span className={paid ? "ok" : late ? "error" : ""}>
                        {paid ? "Pagado" : late ? "Atrasado" : installment.paidAmount.gt(0) ? "Parcial" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <div>
          <PaymentForm loanId={id} />
          <section className="panel">
            <h2>Últimos pagos</h2>
            {loan.payments.map((payment) => (
              <p key={payment.id}>${payment.amount.toString()} · {payment.effectiveDate.toISOString().slice(0, 10)} {payment.receipt && <a href={`/receipts/${payment.receipt.id}`}>Ver recibo ↗</a>}</p>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
