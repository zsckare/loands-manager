import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { receiptPdf } from "@/lib/simple-pdf";
import { errorResponse, HttpError } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) throw new HttpError(401, "Unauthorized");
    const { id } = await params;
    const receipt = await db.receipt.findFirst({
      where: { id, ownerId },
      include: { payment: { include: { loan: { include: { client: true } }, allocations: { include: { installment: true } } } } },
    });
    if (!receipt) throw new HttpError(404, "Receipt not found");
    const payment = receipt.payment;
    const number = `LM-${String(receipt.number).padStart(7, "0")}`;
    const lines = [
      "LOANS MANAGER - COMPROBANTE DE PAGO",
      "--------------------------------------------",
      `Folio: ${number}`,
      `Fecha de pago: ${payment.effectiveDate.toISOString().slice(0, 10)}`,
      `Cliente: ${payment.loan.client.firstName} ${payment.loan.client.lastName}`,
      `Prestamo: ${payment.loanId}`,
      `Importe recibido: $${payment.amount.toFixed(2)} MXN`,
      "--------------------------------------------",
      "Aplicacion a cuotas:",
      ...payment.allocations.map((a) => `Cuota ${a.installment.number}: $${a.amount.toFixed(2)} MXN`),
      "--------------------------------------------",
      "Comprobante de registro de pago. No es factura fiscal.",
    ];
    const bytes = receiptPdf(lines);
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${number}.pdf"`,
      "Cache-Control": "private, no-store",
    } });
  } catch (error) { return errorResponse(error); }
}
