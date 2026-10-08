import { NextResponse } from 'next/server';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { setSession } from '@/lib/auth';
export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        if (typeof email !== 'string' || typeof password !== 'string')
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user)
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        const [salt, hash] = user.passwordHash.split(':');
        if (!salt || !hash)
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        const a = scryptSync(password, salt, 64);
        const b = Buffer.from(hash, 'hex');
        if (a.length !== b.length || !timingSafeEqual(a, b))
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        await setSession(user.id);
        return NextResponse.json({ ok: true });
    }
    catch {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
}
