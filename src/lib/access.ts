import "server-only";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { can, type Capability } from "@/lib/permissions";

/** Centralized access policy. / Política centralizada de acceso. */
export async function actor() {
  const id = await currentUserId();
  if (!id) throw new HttpError(401, "Unauthorized");
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true, managerId: true, active: true, name: true },
  });
  if (!user?.active) throw new HttpError(403, "Inactive account");
  return user;
}

export type Actor = Awaited<ReturnType<typeof actor>>;
/** Never trust hidden UI controls: enforce permissions on the server. */
export function authorize(user: Actor, capability: Capability): void {
  if (!can(user.role, capability)) throw new HttpError(403, "Insufficient permissions");
}

/** Financial data belongs to the administrator, never to the staff account. */
export function portfolioOwner(user: Actor): string {
  if (user.role !== "ADMIN" && !user.managerId) {
    throw new HttpError(403, "No portfolio assigned");
  }
  return user.role === "ADMIN" ? user.id : user.managerId!;
}

/** Prisma filter for assigned collector clients; supervisor sees whole team. */
export function clientScope(user: Actor) {
  const ownerId = portfolioOwner(user);
  return user.role === "COLLECTOR"
    ? { ownerId, assignments: { some: { collectorId: user.id } } }
    : { ownerId };
}

export function loanScope(user: Actor) {
  return { ownerId: portfolioOwner(user), ...(user.role === "COLLECTOR"
    ? { client: { assignments: { some: { collectorId: user.id } } } }
    : {}) };
}

export async function accessibleLoan(user: Actor, loanId: string) {
  const loan = await db.loan.findFirst({ where: { id: loanId, ...loanScope(user) }, select: { id: true } });
  if (!loan) throw new HttpError(404, "Loan not found");
  return loan;
}
