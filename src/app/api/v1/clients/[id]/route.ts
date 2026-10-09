import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, HttpError } from '@/lib/http';
import { actor, authorize, clientScope, portfolioOwner } from '@/lib/access';
import { clientSchema } from '@/server/schemas';
type C = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_: Request, { params }: C) { try {
    const user = await actor();
    const { id } = await params;
    const client = await db.client.findFirst({ where: { id, ...clientScope(user) }, include: { loans: { include: { installments: true } } } });
    if (!client)
        throw new HttpError(404, 'Not found');
    return NextResponse.json(client);
}
catch (e) {
    return errorResponse(e);
} }
export async function PATCH(req: Request, { params }: C) { try {
    const user = await actor();
    authorize(user, "editClient");
    const ownerId = portfolioOwner(user);
    const { id } = await params;
    const body = clientSchema.partial().parse(await req.json());
    const result = await db.client.updateMany({ where: { id, ownerId }, data: body });
    if (!result.count)
        throw new HttpError(404, 'Not found');
    return NextResponse.json({ ok: true });
}
catch (e) {
    return errorResponse(e);
} }
