import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/http';
import { actor, authorize, portfolioOwner } from '@/lib/access';
import { planSchema } from '@/server/schemas';
export async function GET() { try {
    const user = await actor();
    const ownerId = portfolioOwner(user);
    return NextResponse.json(await db.loanPlan.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } }));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request) { try {
    const user = await actor();
    authorize(user, "managePlans");
    const ownerId = portfolioOwner(user);
    const data = planSchema.parse(await req.json());
    return NextResponse.json(await db.loanPlan.create({ data: { ...data, ownerId } }), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
