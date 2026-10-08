import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
const cookieName = 'loans_session';
function sign(value: string) { return createHmac('sha256', process.env.AUTH_SECRET!).update(value).digest('hex'); }
export async function currentUserId(): Promise<string | null> {
    const token = (await cookies()).get(cookieName)?.value;
    if (!token || !process.env.AUTH_SECRET)
        return null;
    const [id, expires, signature] = token.split('.');
    if (!id || !/^\d+$/.test(expires ?? '') || !signature || Number(expires) < Date.now())
        return null;
    const expected = Buffer.from(sign(`${id}.${expires}`), 'hex');
    const received = Buffer.from(signature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received) ? id : null;
}
export async function setSession(userId: string) {
    const expires = Date.now() + 7 * 86400000;
    (await cookies()).set(cookieName, `${userId}.${expires}.${sign(`${userId}.${expires}`)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 604800 });
}
export async function clearSession() { (await cookies()).delete(cookieName); }
