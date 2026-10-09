import assert from "node:assert/strict";
import test from "node:test";
import { balance } from "../src/lib/ledger.ts";

test("ledger applies signed amounts in exact cents", () => {
  assert.equal(balance([
    { type: "DISBURSEMENT", cents: 500000n },
    { type: "PAYMENT", cents: 60000n },
    { type: "PAYMENT", cents: 25000n },
    { type: "EXPENSE", cents: 10000n },
  ]), -425000n);
});
test("empty ledger has zero balance", () => {
  assert.equal(balance([]), 0n);
});
