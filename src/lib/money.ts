/** Store and calculate money as integer cents; never use floating-point for persisted money. */
export function cents(input: string | number): bigint {
    const value = String(input);
    if (!/^\d+(\.\d{1,2})?$/.test(value))
        throw new Error('Invalid money amount');
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
export function money(value: bigint): string {
    const negative = value < 0n ? '-' : '';
    const abs = value < 0n ? -value : value;
    return `${negative}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
}
export function calculate(principal: string, rate: string, count: number) {
    if (!Number.isSafeInteger(count) || count < 1 || count > 730)
        throw new Error('Invalid installment count');
    if (!/^\d+(\.\d{1,4})?$/.test(rate))
        throw new Error('Invalid interest rate');
    const [whole, fraction = ''] = rate.split('.');
    const rateUnits = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'));
    const principalCents = cents(principal);
    if (principalCents <= 0n || rateUnits > 10000000n)
        throw new Error('Invalid loan values');
    const interest = (principalCents * rateUnits + 500000n) / 1000000n;
    const total = principalCents + interest;
    const base = total / BigInt(count);
    const remainder = total % BigInt(count);
    return { total: money(total), interest: money(interest), installments: Array.from({ length: count }, (_, i) => money(base + (BigInt(i) < remainder ? 1n : 0n))) };
}
