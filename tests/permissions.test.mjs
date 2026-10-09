import assert from "node:assert/strict";
import test from "node:test";
import { can } from "../src/lib/permissions.ts";

test("collector may collect but cannot access cash, reports or staff", () => {
  assert.equal(can("COLLECTOR", "collect"), true);
  for (const capability of ["manageStaff", "managePlans", "createLoan", "editClient", "viewCash", "manageCash", "viewReports"]) {
    assert.equal(can("COLLECTOR", capability), false);
  }
});
test("supervisor can create loans and view reports but not close cash", () => {
  assert.equal(can("SUPERVISOR", "createLoan"), true);
  assert.equal(can("SUPERVISOR", "viewReports"), true);
  assert.equal(can("SUPERVISOR", "manageCash"), false);
});
test("administrator has every capability", () => {
  for (const capability of ["manageStaff", "managePlans", "createLoan", "editClient", "collect", "viewCash", "manageCash", "viewReports"]) {
    assert.equal(can("ADMIN", capability), true);
  }
});
