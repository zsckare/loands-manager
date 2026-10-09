import { Suspense } from "react";
import { db } from "@/lib/db";
import { staff } from "@/lib/roles";
import { CashForm } from "@/components/cash-form";

export default function CashPage() {
  return <Suspense fallback={<p>Cargando caja...</p>}><CashContent /></Suspense>;
}

async function CashContent() {
  const user = await staff();
  if (user.role !== "ADMIN") return <section className="panel"><h2>Acceso restringido</h2><p>Solo administradores pueden gestionar caja.</p></section>;
  const entries = await db.cashEntry.findMany({ where: { ownerId: user.id }, orderBy: { occurredAt: "desc" }, take: 200 });
  // The full ledger balance is calculated from all records, not just the visible 200.
  const totals = await db.cashEntry.groupBy({
    by: ["type"], where: { ownerId: user.id }, _sum: { amount: true },
  });
  const signed = (type: string, amount: number) => type === "DISBURSEMENT" || type === "EXPENSE" ? -amount : amount;
  const balance = totals.reduce((total, row) => total + signed(row.type, Number(row._sum.amount ?? 0)), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((e) => e.occurredAt.toISOString().slice(0, 10) === today);
  const todayTotal = todayEntries.reduce((total, e) => total + signed(e.type, Number(e.amount)), 0);
  return <>
    <header><h1>Caja y movimientos</h1><p>Entradas, salidas, desembolsos y pagos registrados.</p></header>
    <div className="metrics">
      <article className="metric"><span>Balance acumulado</span><strong>${balance.toFixed(2)}</strong></article>
      <article className="metric"><span>Movimiento neto de hoy (UTC)</span><strong>${todayTotal.toFixed(2)}</strong></article>
      <article className="metric"><span>Movimientos mostrados</span><strong>{entries.length}</strong></article>
    </div>
    <div className="columns"><section className="panel"><h2>Libro de caja</h2><div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Importe</th></tr></thead><tbody>
      {entries.map((entry) => <tr key={entry.id}><td>{entry.occurredAt.toISOString().slice(0, 10)}</td><td>{entry.type}</td><td>{entry.description}</td><td className={signed(entry.type, Number(entry.amount)) < 0 ? "error" : "ok"}>{signed(entry.type, Number(entry.amount)) < 0 ? "−" : "+"}${entry.amount.toFixed(2)}</td></tr>)}
      {!entries.length && <tr><td colSpan={4}>Todavía no hay movimientos.</td></tr>}
    </tbody></table></div></section><CashForm /></div>
    <p className="hint">Los movimientos previos a esta migración no se agregan automáticamente. El balance incluye todos los movimientos; el listado muestra los 200 más recientes. El cierre contable requiere conciliación.</p>
  </>;
}
