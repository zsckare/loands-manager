import type { Frequency } from '@/generated/prisma/client';
/** Date-only arithmetic uses UTC to avoid DST shifts. ISO weekday: 1=Mon, 7=Sun. */
export function schedule(start: string, count: number, frequency: Frequency, allowedDays: number[]): Date[] {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start))
        throw new Error('Invalid start date');
    const origin = new Date(`${start}T12:00:00Z`);
    if (Number.isNaN(origin.getTime()) || origin.toISOString().slice(0, 10) !== start)
        throw new Error('Invalid date');
    if (!allowedDays.length || allowedDays.some(d => d < 1 || d > 7))
        throw new Error('Invalid collection days');
    const dates: Date[] = [];
    let cursor = new Date(origin);
    for (let i = 0; i < count; i++) {
        if (frequency === 'DAILY')
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        if (frequency === 'WEEKLY')
            cursor.setUTCDate(cursor.getUTCDate() + 7);
        if (frequency === 'BIWEEKLY')
            cursor.setUTCDate(cursor.getUTCDate() + 15);
        if (frequency === 'MONTHLY') {
            const desiredDay = origin.getUTCDate();
            const month = origin.getUTCMonth() + i + 1;
            const y = origin.getUTCFullYear() + Math.floor(month / 12);
            const m = month % 12;
            cursor = new Date(Date.UTC(y, m, Math.min(desiredDay, new Date(Date.UTC(y, m + 1, 0)).getUTCDate()), 12));
        }
        if (frequency === 'DAILY') {
            let guard = 0;
            while (!allowedDays.includes(cursor.getUTCDay() || 7)) {
                cursor.setUTCDate(cursor.getUTCDate() + 1);
                if (++guard > 7)
                    throw new Error('Invalid collection days');
            }
        }
        dates.push(new Date(cursor));
    }
    return dates;
}
