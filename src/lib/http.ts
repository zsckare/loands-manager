import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { currentUserId } from './auth';
export async function owner() { const id = await currentUserId(); if (!id)
    throw new HttpError(401, 'Unauthorized'); return id; }
export class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export function errorResponse(error: unknown) {
    if (error instanceof ZodError)
        return NextResponse.json({ error: 'Invalid request', issues: error.issues }, { status: 400 });
    if (error instanceof HttpError)
        return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && (error.message.startsWith('Invalid') || error.message === 'Insufficient balance'))
        return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
