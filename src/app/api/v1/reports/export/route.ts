import { actor, authorize, portfolioOwner } from "@/lib/access";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

/** Escape spreadsheet formula injection and RFC4180 CSV values. */
function cell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  try {
    const user = await actor();
    authorize(user, "viewReports");
    const ownerId = portfolioOwner(user);
    const params = new URL(request.url).searchParams;
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status");
    if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) ||
        (status && !["ACTIVE", "PAID_OFF", "CANCELLED"].includes(status))) {
      return new Response("Invalid report filters", { status: 400 });
    }
    const loans = await db.loan.findMany({
      where: { ownerId,
        ...(status ? { status: status as "ACTIVE" | "PAID_OFF" | "CANCELLED" } : {}),
        ...(from || to ? { startDate: {
          ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
          ...(to ? { lte: new Date(`${to}T00:00:00Z`) } : {}),
        } } : {}),
      },
      include: { client: true, installments: true },
      orderBy: { createdAt: "desc" },
    });
    const rows = [["Cliente", "Capital", "Interés", "Total", "Recuperado", "Pendiente", "Estado"]];
    for (const loan of loans) {
      const recovered = loan.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);
      rows.push([
        `${loan.client.firstName} ${loan.client.lastName}`,
        loan.principal.toString(), loan.totalInterest.toString(), loan.totalPayable.toString(),
        recovered.toFixed(2), (Number(loan.totalPayable) - recovered).toFixed(2), loan.status,
      ]);
    }
    const csv = "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
    return new Response(csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cartera-loans-manager.csv"',
      "Cache-Control": "private, no-store",
    } });
  } catch (error) { return errorResponse(error); }
}
