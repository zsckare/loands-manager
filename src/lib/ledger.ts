/** Pure cash sign rule for accounting totals. */
export function signedCents(type: "DISBURSEMENT" | "PAYMENT" | "INCOME" | "EXPENSE", cents: bigint): bigint {
  return type === "DISBURSEMENT" || type === "EXPENSE" ? -cents : cents;
}
export function balance(entries: readonly { type: "DISBURSEMENT" | "PAYMENT" | "INCOME" | "EXPENSE"; cents: bigint }[]): bigint {
  return entries.reduce((total, entry) => total + signedCents(entry.type, entry.cents), 0n);
}
