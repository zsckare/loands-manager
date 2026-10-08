import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse, HttpError } from '@/lib/http';
import { clientSchema } from '@/server/schemas';
type C = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_: Request, { params }: C) { try {
    const ownerId = await owner();
    const { id } = await params;
    const client = await db.client.findFirst({ where: { id, ownerId }, include: { loans: { include: { installments: true } } } });
    if (!client)
        throw new HttpError(404, 'Not found');
    return NextResponse.json(client);
}
catch (e) {
    return errorResponse(e);
} }
export async function PATCH(req: Request, { params }: C) { try {
    const ownerId = await owner();
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
