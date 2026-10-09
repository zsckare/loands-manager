import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/roles";

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12),
  role: z.enum(["SUPERVISOR", "COLLECTOR"]),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    const users = await db.user.findMany({
      where: { OR: [{ id: admin.id }, { managerId: admin.id }] },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = createSchema.parse(await request.json());
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HttpError(409, "Email already registered");
    const passwordHash = await hash(input.password, 12);
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: input.name, email: input.email, passwordHash,
          role: input.role, managerId: admin.id },
        select: { id: true, name: true, email: true, role: true },
      });
      await tx.auditEvent.create({ data: {
        ownerId: admin.id, actorId: admin.id, action: "STAFF_CREATED",
        entityType: "User", entityId: created.id, details: { role: created.role },
      } });
      return created;
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
