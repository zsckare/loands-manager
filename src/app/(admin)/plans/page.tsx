import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { PlanForm } from "@/components/plans";

/** Streams authenticated plan data. / Carga los planes dentro de Suspense. */
export default function PlansPage() {
  return <Suspense fallback={<p>Cargando planes...</p>}><PlansContent /></Suspense>;
}

async function PlansContent() {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const rows = await db.loanPlan.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <header><h1>Planes de préstamo</h1><p>Condiciones reutilizables para nuevos préstamos</p></header>
      <div className="columns">
        <section className="panel">
          <h2>Planes ({rows.length})</h2>
          <table>
            <thead><tr><th>Nombre</th><th>Abonos</th><th>Interés</th><th>Estado</th></tr></thead>
            <tbody>
              {rows.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.installmentCount}</td>
                  <td>{plan.interestRate.toString()}%</td>
                  <td>{plan.active ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <PlanForm />
      </div>
    </>
  );
}
