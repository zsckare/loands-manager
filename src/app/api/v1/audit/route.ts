import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/roles";

/** Read-only audit history / Historial de auditoría de solo lectura. */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const params = new URL(request.url).searchParams;
    const take = Math.min(Math.max(Number(params.get("limit") ?? 50) || 50, 1), 200);
    const events = await db.auditEvent.findMany({
      where: { ownerId: admin.id },
      orderBy: { createdAt: "desc" },
      take,
    });
    return NextResponse.json(events, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
