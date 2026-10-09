import { Suspense } from "react";
import { db } from "@/lib/db";
import { staff } from "@/lib/roles";
import { CashForm } from "@/components/cash-form";
import { CashCloseForm } from "@/components/cash-close-form";

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
  const closes = await db.cashClose.findMany({ where: { ownerId: user.id }, orderBy: { businessDate: "desc" }, take: 15 });
  const auditEvents = await db.auditEvent.findMany({
    where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 20,
  });
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
    <CashCloseForm />
    <section className="panel"><h2>Últimos cierres</h2><div className="table-scroll"><table><thead><tr><th>Día</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead><tbody>
      {closes.map(c => <tr key={c.id}><td>{c.businessDate.toISOString().slice(0, 10)}</td><td>${c.expectedBalance.toFixed(2)}</td><td>${c.countedBalance.toFixed(2)}</td><td>${c.difference.toFixed(2)}</td></tr>)}
      {!closes.length && <tr><td colSpan={4}>Aún no hay cierres registrados.</td></tr>}
    </tbody></table></div></section>
    <section className="panel"><h2>Auditoría reciente</h2><div className="table-scroll"><table>
      <thead><tr><th>Fecha</th><th>Acción</th><th>Registro</th></tr></thead><tbody>
      {auditEvents.map(event => <tr key={event.id}>
        <td>{event.createdAt.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}</td>
        <td>{event.action}</td><td>{event.entityType} · {event.entityId.slice(0, 8)}</td>
      </tr>)}
      {!auditEvents.length && <tr><td colSpan={3}>Sin eventos de auditoría.</td></tr>}
      </tbody></table></div></section>
    <p className="hint">Los movimientos previos a esta migración no se agregan automáticamente. El balance incluye todos los movimientos; el listado muestra los 200 más recientes. El cierre contable requiere conciliación.</p>
  </>;
}
