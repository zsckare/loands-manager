import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/http';
import { actor, authorize, clientScope, portfolioOwner } from '@/lib/access';
import { clientSchema } from '@/server/schemas';
export async function GET() { try {
    const user = await actor();
    return NextResponse.json(await db.client.findMany({ where: clientScope(user), orderBy: { createdAt: 'desc' } }));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request) { try {
    const user = await actor();
    authorize(user, "editClient");
    const ownerId = portfolioOwner(user);
    const data = clientSchema.parse(await req.json());
    return NextResponse.json(await db.client.create({ data: { ...data, ownerId } }), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
