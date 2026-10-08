import { z } from 'zod';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { owner, errorResponse, HttpError } from '@/lib/http';
import { planSchema } from '@/server/schemas';
type C = {
    params: Promise<{
        id: string;
    }>;
};
export async function PATCH(req: Request, { params }: C) { try {
    const ownerId = await owner();
    const { id } = await params;
    const body = planSchema.partial().extend({ active: z.boolean().optional() }).parse(await req.json());
    const result = await db.loanPlan.updateMany({ where: { id, ownerId }, data: body });
    if (!result.count)
        throw new HttpError(404, 'Not found');
    return NextResponse.json({ ok: true });
}
catch (e) {
    return errorResponse(e);
} }
