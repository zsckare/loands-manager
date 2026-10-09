import { Suspense } from "react";
import { db } from "@/lib/db";
import { staff } from "@/lib/roles";
import { StaffForm } from "@/components/staff-form";
import { AssignCollector } from "@/components/assign-collector";

export default function StaffPage() {
  return <Suspense fallback={<p>Cargando equipo...</p>}><StaffContent /></Suspense>;
}

async function StaffContent() {
  const admin = await staff();
  if (admin.role !== "ADMIN") return <section className="panel"><h2>Acceso restringido</h2><p>Solo administradores pueden gestionar personal.</p></section>;
  const [members, clients] = await Promise.all([
    db.user.findMany({ where: { managerId: admin.id }, select: { id: true, name: true, email: true, role: true, active: true }, orderBy: { name: "asc" } }),
    db.client.findMany({ where: { ownerId: admin.id }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
  ]);
  return <>
    <header><h1>Equipo y cobradores</h1><p>Usuarios, roles y asignación de cartera.</p></header>
    <div className="columns"><section className="panel"><h2>Integrantes ({members.length})</h2><div className="table-scroll"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>
      {members.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.active ? "Activo" : "Inactivo"}</td></tr>)}
    </tbody></table></div></section><StaffForm /></div>
    <AssignCollector clients={clients.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))} collectors={members.filter((u) => u.role === "COLLECTOR" && u.active).map((u) => ({ id: u.id, name: u.name }))} />
    <p className="hint">La administración de roles está disponible; la delegación completa de operaciones de cobranza por cobrador requiere endurecer el alcance de los endpoints existentes antes de habilitarla en producción.</p>
  </>;
}
