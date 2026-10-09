import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";

export default function ReceiptsPage() {
  return <Suspense fallback={<p>Cargando comprobantes...</p>}><ReceiptsContent /></Suspense>;
}

async function ReceiptsContent() {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const receipts = await db.receipt.findMany({
    where: { ownerId },
    include: { payment: { include: { loan: { include: { client: true } } } } },
    orderBy: { issuedAt: "desc" }, take: 150,
  });
  return <>
    <header><h1>Comprobantes</h1><p>Recibos foliados de pagos registrados.</p></header>
    <section className="panel">
      <h2>Historial de recibos</h2>
      <div className="table-scroll"><table><thead><tr><th>Folio</th><th>Cliente</th><th>Fecha</th><th>Importe</th><th>Comprobante</th></tr></thead><tbody>
        {receipts.map((r) => <tr key={r.id}>
          <td>LM-{String(r.number).padStart(7, "0")}</td>
          <td>{r.payment.loan.client.firstName} {r.payment.loan.client.lastName}</td>
          <td>{r.payment.effectiveDate.toISOString().slice(0, 10)}</td>
          <td>${r.payment.amount.toFixed(2)}</td>
          <td><Link href={`/receipts/${r.id}`}>Ver / PDF ↗</Link></td>
        </tr>)}
        {!receipts.length && <tr><td colSpan={5}>No hay recibos todavía.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}
