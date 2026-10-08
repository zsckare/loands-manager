import { db } from '@/lib/db';
import { currentUserId } from '@/lib/auth';
import { ClientForm } from '@/components/clients';
export default async function Clients() { const ownerId = (await currentUserId())!; const rows = await db.client.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } }); return <><header><h1>Clientes</h1><p>Expedientes y contactos</p></header><div className="columns"><section className="panel"><h2>Clientes registrados ({rows.length})</h2><table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Estado</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td>{c.firstName} {c.lastName}</td><td>{c.phone || '—'}</td><td>{c.status}</td></tr>)}</tbody></table></section><ClientForm /></div></>; }
