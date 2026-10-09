import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";
import { ClientForm } from "@/components/clients";

/** Displays the page shell while authenticated data loads. / Muestra la estructura mientras se cargan los datos. */
export default function ClientsPage() {
  return <Suspense fallback={<p>Cargando clientes...</p>}><ClientsContent /></Suspense>;
}

/** Loads only the current owner's clients. / Consulta únicamente los clientes del usuario actual. */
async function ClientsContent() {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const rows = await db.client.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <header><h1>Clientes</h1><p>Expedientes y contactos</p></header>
      <div className="columns">
        <section className="panel">
          <h2>Clientes registrados ({rows.length})</h2>
          <table>
            <thead><tr><th>Cliente</th><th>Teléfono</th><th>Estado</th></tr></thead>
            <tbody>
              {rows.map((client) => (
                <tr key={client.id}>
                  <td>{client.firstName} {client.lastName}</td>
                  <td>{client.phone || "—"}</td>
                  <td>{client.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <ClientForm />
      </div>
    </>
  );
}
