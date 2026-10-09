import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { PrintReceipt } from "@/components/print-receipt";

type Props = { params: Promise<{ id: string }> };
export default function ReceiptPage({ params }: Props) {
  return <Suspense fallback={<p>Cargando recibo...</p>}><ReceiptContent params={params} /></Suspense>;
}

async function ReceiptContent({ params }: Props) {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const { id } = await params;
  const receipt = await db.receipt.findFirst({
    where: { id, ownerId },
    include: { payment: { include: { loan: { include: { client: true } }, allocations: { include: { installment: true } } } } },
  });
  if (!receipt) notFound();
  const { payment } = receipt;
  return <>
    <header className="no-print"><h1>Comprobante de pago</h1><p>Imprime o guarda como PDF desde tu dispositivo.</p></header>
    <div className="receipt-actions no-print"><PrintReceipt /><a className="action-link" href={`/api/v1/receipts/${receipt.id}/pdf`}>Descargar PDF ↓</a></div>
    <article className="receipt-paper">
      <div className="receipt-heading"><div><strong className="receipt-brand">◈ Loans Manager</strong><p>Comprobante de abono</p></div><div><span>Folio</span><h2>LM-{String(receipt.number).padStart(7, "0")}</h2></div></div>
      <hr />
      <dl className="receipt-details">
        <div><dt>Cliente</dt><dd>{payment.loan.client.firstName} {payment.loan.client.lastName}</dd></div>
        <div><dt>Fecha de pago</dt><dd>{payment.effectiveDate.toISOString().slice(0, 10)}</dd></div>
        <div><dt>Préstamo</dt><dd>{payment.loanId.slice(0, 8).toUpperCase()}</dd></div>
        <div><dt>Fecha de emisión</dt><dd>{receipt.issuedAt.toISOString().slice(0, 10)}</dd></div>
      </dl>
      <div className="receipt-total"><span>Importe recibido</span><strong>${payment.amount.toFixed(2)} MXN</strong></div>
      <h3>Aplicación del pago</h3>
      <table><thead><tr><th>Cuota</th><th>Importe aplicado</th></tr></thead><tbody>
        {payment.allocations.map((a) => <tr key={a.id}><td>#{a.installment.number}</td><td>${a.amount.toFixed(2)}</td></tr>)}
      </tbody></table>
      {payment.note && <p>Nota: {payment.note}</p>}
      <p className="receipt-footer">Este comprobante acredita el registro del abono indicado. No es un comprobante fiscal.</p>
    </article>
  </>;
}
