/** Pure role policy, shared by the API and automated tests. */
export type Role = "ADMIN" | "SUPERVISOR" | "COLLECTOR";
export type Capability = "manageStaff" | "managePlans" | "createLoan" | "editClient" | "collect" | "viewCash" | "manageCash" | "viewReports";

export const capabilities: Readonly<Record<Capability, readonly Role[]>> = {
  manageStaff: ["ADMIN"],
  managePlans: ["ADMIN"],
  createLoan: ["ADMIN", "SUPERVISOR"],
  editClient: ["ADMIN", "SUPERVISOR"],
  collect: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  viewCash: ["ADMIN"],
  manageCash: ["ADMIN"],
  viewReports: ["ADMIN", "SUPERVISOR"],
};

export function can(role: Role, capability: Capability): boolean {
  return capabilities[capability].includes(role);
}
