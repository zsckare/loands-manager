import { db } from "@/lib/db";
import { actor, authorize, portfolioOwner } from "@/lib/access";
import { errorResponse } from "@/lib/http";
import { spreadsheet } from "@/lib/xlsx";
import { loanSummary } from "@/server/loans";

/** Genuine XLSX export with numeric money columns. */
export async function GET(request: Request) {
  try {
    const user = await actor();
    authorize(user, "viewReports");
    const ownerId = portfolioOwner(user);
    const search = new URL(request.url).searchParams;
    const from = search.get("from");
    const to = search.get("to");
    const status = search.get("status");
    if (status && !["ACTIVE", "PAID_OFF", "CANCELLED"].includes(status)) {
      return new Response("Invalid status filter", { status: 400 });
    }
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !datePattern.test(from)) || (to && !datePattern.test(to))) {
      return new Response("Invalid date filter", { status: 400 });
    }
    const loans = await db.loan.findMany({
      where: { ownerId, ...(status ? { status: status as "ACTIVE" | "PAID_OFF" | "CANCELLED" } : {}), ...(from || to ? { startDate: {
        ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
        ...(to ? { lte: new Date(`${to}T00:00:00Z`) } : {}),
      } } : {}) },
      include: { client: true, installments: true },
      orderBy: { createdAt: "desc" },
    });
    const rows: (string | number)[][] = [["Cliente", "Inicio", "Capital MXN", "Interés pactado MXN", "Total MXN", "Recuperado MXN", "Pendiente MXN", "Vencido MXN", "Estado"]];
    for (const loan of loans) {
      const summary = loanSummary(loan);
      rows.push([
        `${loan.client.firstName} ${loan.client.lastName}`,
        loan.startDate.toISOString().slice(0, 10),
        Number(loan.principal), Number(loan.totalInterest), Number(loan.totalPayable),
        Number(summary.recovered), Number(summary.outstanding), Number(summary.overdue), loan.status,
      ]);
    }
    const bytes = spreadsheet(rows);
    return new Response(Buffer.from(bytes), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="cartera-loans-manager.xlsx"',
      "Cache-Control": "private, no-store",
    } });
  } catch (error) { return errorResponse(error); }
}
