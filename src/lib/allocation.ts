/** Pure installment allocation, independent of Prisma.
 * Distribuye pagos a las cuotas más antiguas sin exceder el saldo.
 */
export function allocateOldest(
  installmentBalances: readonly bigint[],
  paymentCents: bigint,
): bigint[] {
  if (paymentCents <= 0n) throw new Error("Payment must be positive");
  if (installmentBalances.some((balance) => balance < 0n)) {
    throw new Error("Invalid installment balance");
  }
  const outstanding = installmentBalances.reduce((total, amount) => total + amount, 0n);
  if (paymentCents > outstanding) throw new Error("Insufficient balance");
  let remaining = paymentCents;
  return installmentBalances.map((balance) => {
    const applied = remaining < balance ? remaining : balance;
    remaining -= applied;
    return applied;
  });
}
