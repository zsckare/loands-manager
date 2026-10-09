import assert from "node:assert/strict";
import test from "node:test";
import { allocateOldest } from "../src/lib/allocation.ts";

test("partial payment is allocated to first installment", () => {
  assert.deepEqual(allocateOldest([60000n, 60000n, 60000n], 25000n), [25000n, 0n, 0n]);
});
test("overpayment of a single installment advances to the next", () => {
  assert.deepEqual(allocateOldest([35000n, 60000n, 60000n], 80000n), [35000n, 45000n, 0n]);
});
test("exact payoff clears every remaining installment", () => {
  assert.deepEqual(allocateOldest([15000n, 60000n, 60000n], 135000n), [15000n, 60000n, 60000n]);
});
test("rejects negative payments and balances above outstanding", () => {
  assert.throws(() => allocateOldest([100n], 0n), /positive/);
  assert.throws(() => allocateOldest([100n], 101n), /Insufficient/);
});
