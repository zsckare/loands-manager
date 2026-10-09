
import Link from "next/link";
import { Suspense } from "react";

import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { loanSummary } from "@/server/loans";
import { cents, money } from "@/lib/money";

/**
 * Dashboard page.
 *
 * Renders the static dashboard shell immediately while
 * the authenticated financial data loads asynchronously.
 *
 * Renderiza la estructura inicial mientras se cargan
 * los datos financieros del usuario autenticado.
 */
export default function Dashboard() {
    return (
        <>
            <header>
                <h1>Dashboard</h1>
                <p>Resumen de tu cartera de préstamos</p>
            </header>

            <Suspense fallback={<DashboardLoading />}>
                <DashboardContent />
            </Suspense>
        </>
    );
}

/**
 * Authenticated dashboard content.
 *
 * Reads the current session and retrieves loans belonging
 * exclusively to the authenticated user.
 *
 * Consulta la sesión actual y obtiene únicamente los
 * préstamos asociados al usuario autenticado.
 */
async function DashboardContent() {
    const ownerId = await currentUserId();

    if (!ownerId) {
        return null;
    }

    const loans = await db.loan.findMany({
        where: {
            ownerId,
        },
        include: {
            client: true,
            installments: true,
        },
    });

    // Financial totals are accumulated in integer cents.
    // Los importes se acumulan en centavos para evitar
    // errores de precisión con números decimales.
    let recovered = 0n;
    let outstanding = 0n;
    let overdue = 0n;
    let active = 0;

    const late: {
        id: string;
        name: string;
        overdue: string;
    }[] = [];

    for (const loan of loans) {
        // Cancelled loans do not contribute to portfolio totals.
        // Los préstamos cancelados no participan en los totales.
        if (loan.status === "CANCELLED") {
            continue;
        }

        const summary = loanSummary(loan);

        recovered += cents(summary.recovered);
        outstanding += cents(summary.outstanding);
        overdue += cents(summary.overdue);

        if (loan.status === "ACTIVE") {
            active++;
        }

        // Collect loans with overdue balances.
        // Identificamos los préstamos con pagos vencidos.
        if (cents(summary.overdue) > 0n) {
            late.push({
                id: loan.id,
                name: `${loan.client.firstName} ${loan.client.lastName}`,
                overdue: summary.overdue,
            });
        }
    }

    return (
        <>
            <div className="metrics">
                <article className="metric">
                    <span>Préstamos activos</span>
                    <strong>{active}</strong>
                </article>

                <article className="metric">
                    <span>Dinero recuperado</span>
                    <strong>${money(recovered)}</strong>
                </article>

                <article className="metric">
                    <span>Total pendiente</span>
                    <strong>${money(outstanding)}</strong>
                </article>

                <article className="metric">
                    <span>Saldo vencido</span>
                    <strong>${money(overdue)}</strong>
                </article>
            </div>

            <section className="panel">
                <h2>Préstamos con atrasos ({late.length})</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Saldo vencido</th>
                            <th>Acción</th>
                        </tr>
                    </thead>

                    <tbody>
                        {late.map((loan) => (
                            <tr key={loan.id}>
                                <td>{loan.name}</td>
                                <td>${loan.overdue}</td>
                                <td>
                                    <Link href={`/loans/${loan.id}`}>
                                        Ver préstamo →
                                    </Link>
                                </td>
                            </tr>
                        ))}

                        {late.length === 0 && (
                            <tr>
                                <td colSpan={3}>
                                    No hay préstamos con saldos vencidos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </>
    );
}

/**
 * Loading placeholder displayed while financial data
 * is being retrieved from PostgreSQL.
 *
 * Se muestra mientras se consulta la información
 * financiera en PostgreSQL.
 */
function DashboardLoading() {
    return (
        <>
            <div className="metrics">
                {[
                    "Préstamos activos",
                    "Dinero recuperado",
                    "Total pendiente",
                    "Saldo vencido",
                ].map((label) => (
                    <article className="metric" key={label}>
                        <span>{label}</span>
                        <strong>—</strong>
                    </article>
                ))}
            </div>

            <section className="panel">
                <h2>Préstamos con atrasos</h2>
                <p>Cargando información financiera...</p>
            </section>
        </>
    );
}
