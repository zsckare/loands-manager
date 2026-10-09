import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin, staff } from "@/lib/roles";

export async function GET() {
  try {
    const user = await staff();
    const assignments = await db.collectorAssignment.findMany({
      where: user.role === "ADMIN" ? { client: { ownerId: user.id } } : { collectorId: user.id },
      include: { client: true, collector: { select: { id: true, name: true } } },
    });
    return NextResponse.json(assignments);
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = z.object({ clientId: z.uuid(), collectorId: z.uuid() }).parse(await request.json());
    const [client, collector] = await Promise.all([
      db.client.findFirst({ where: { id: input.clientId, ownerId: admin.id } }),
      db.user.findFirst({ where: { id: input.collectorId, managerId: admin.id, role: "COLLECTOR", active: true } }),
    ]);
    if (!client || !collector) throw new HttpError(404, "Client or collector not found");
    const result = await db.$transaction(async (tx) => {
      const assignment = await tx.collectorAssignment.upsert({
        where: { clientId: client.id },
        create: { clientId: client.id, collectorId: collector.id, assignedById: admin.id },
        update: { collectorId: collector.id, assignedById: admin.id },
      });
      await tx.auditEvent.create({ data: {
        ownerId: admin.id, actorId: admin.id, action: "COLLECTOR_ASSIGNED",
        entityType: "Client", entityId: client.id, details: { collectorId: collector.id },
      } });
      return assignment;
    });
    return NextResponse.json(result);
  } catch (error) { return errorResponse(error); }
}
