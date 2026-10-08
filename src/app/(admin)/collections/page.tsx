
import Link from "next/link";
import { Suspense } from "react";

import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";

/**
 * Collections page.
 *
 * Displays a loading fallback while the server retrieves
 * overdue installments belonging to the current user.
 */
export default function CollectionsPage() {
    return (
        <Suspense fallback={<CollectionsLoading />}>
            <CollectionsContent />
        </Suspense>
    );
}

/**
 * Loads overdue installments and renders the collections table.
 *
 * An installment is overdue when:
 * - Its due date is earlier than today.
 * - Its outstanding balance is greater than zero.
 * - Its loan is active.
 *
 * Results are restricted to the authenticated owner.
 */
async function CollectionsContent() {
    const ownerId = await currentUserId();

    if (!ownerId) {
        return null;
    }

    // Use UTC midnight to match the existing date-only
    // comparison behavior used by the application.
    const today = new Date(
        `${new Date().toISOString().slice(0, 10)}T00:00:00Z`
    );

    const installments = await db.installment.findMany({
        where: {
            dueDate: {
                lt: today,
            },
            loan: {
                ownerId,
                status: "ACTIVE",
            },
        },
        include: {
            loan: {
                include: {
                    client: true,
                },
            },
        },
        orderBy: {
            dueDate: "asc",
        },
    });

    // Only installments with an unpaid balance are overdue.
    const overdueInstallments = installments.filter(
        (installment) =>
            installment.paidAmount.lt(installment.amount)
    );

    return (
        <>
            <header>
                <h1>Cobranza</h1>

                <p>
                    Abonos vencidos que aún tienen saldo pendiente
                </p>
            </header>

            <section className="panel">
                <h2>
                    {overdueInstallments.length} abonos atrasados
                </h2>

                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Préstamo</th>
                            <th>Vencimiento</th>
                            <th>Importe vencido</th>
                        </tr>
                    </thead>

                    <tbody>
                        {overdueInstallments.map((installment) => {
                            const client = installment.loan.client;

                            const outstandingAmount =
                                installment.amount.minus(
                                    installment.paidAmount
                                );

                            const dueDate = installment.dueDate
                                .toISOString()
                                .slice(0, 10);

                            return (
                                <tr key={installment.id}>
                                    <td>
                                        {client.firstName} {client.lastName}
                                    </td>

                                    <td>
                                        <Link
                                            href={`/loans/${installment.loanId}`}
                                        >
                                            Ver préstamo
                                        </Link>
                                    </td>

                                    <td>{dueDate}</td>

                                    <td>
                                        ${outstandingAmount.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}

                        {overdueInstallments.length === 0 && (
                            <tr>
                                <td colSpan={4}>
                                    No hay abonos vencidos pendientes.
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
 * Placeholder displayed while the collections data loads.
 */
function CollectionsLoading() {
    return (
        <>
            <header>
                <h1>Cobranza</h1>

                <p>
                    Abonos vencidos que aún tienen saldo pendiente
                </p>
            </header>

            <section className="panel">
                <p>Cargando información de cobranza...</p>
            </section>
        </>
    );
}
