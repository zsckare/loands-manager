import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse } from '@/lib/http';
import { clientSchema } from '@/server/schemas';
export async function GET() { try {
    const ownerId = await owner();
    return NextResponse.json(await db.client.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } }));
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(req: Request) { try {
    const ownerId = await owner();
    const data = clientSchema.parse(await req.json());
    return NextResponse.json(await db.client.create({ data: { ...data, ownerId } }), { status: 201 });
}
catch (e) {
    return errorResponse(e);
} }
