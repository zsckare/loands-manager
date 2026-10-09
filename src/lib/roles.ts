import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { HttpError } from "@/lib/http";

/** Resolve the authenticated staff member and role. / Obtiene el rol del usuario. */
export async function staff() {
  const id = await currentUserId();
  if (!id) throw new HttpError(401, "Unauthorized");
  const user = await db.user.findUnique({ where: { id }, select: {
    id: true, name: true, email: true, role: true, active: true, managerId: true,
  } });
  if (!user?.active) throw new HttpError(403, "Inactive account");
  return user;
}

/** Prevent privilege escalation on management endpoints. */
export async function requireAdmin() {
  const user = await staff();
  if (user.role !== "ADMIN") throw new HttpError(403, "Administrator access required");
  return user;
}
