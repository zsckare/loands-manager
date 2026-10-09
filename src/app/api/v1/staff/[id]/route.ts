import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/roles";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = z.object({ active: z.boolean() }).parse(await request.json());
    const target = await db.user.findFirst({ where: { id, managerId: admin.id } });
    if (!target) throw new HttpError(404, "Staff member not found");
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id }, data: input,
        select: { id: true, active: true } });
      await tx.auditEvent.create({ data: {
        ownerId: admin.id, actorId: admin.id, action: "STAFF_STATUS_CHANGED",
        entityType: "User", entityId: id, details: { active: input.active },
      } });
      return updated;
    });
    return NextResponse.json(result);
  } catch (error) { return errorResponse(error); }
}
