'use client';
import { useState } from 'react';
type Option = {
    id: string;
    name: string;
};
export function LoanForm({ clients, plans }: {
    clients: Option[];
    plans: Option[];
}) { const [error, setError] = useState(''); return <form className="panel form" onSubmit={async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); const r = await fetch('/api/v1/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); if (!r.ok) {
    setError((await r.json()).error ?? 'Error al crear préstamo');
    return;
} location.href = '/loans/' + (await r.json()).id; }}><h2>Nuevo préstamo</h2><label>Cliente<select name="clientId" required>{clients.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Plan<select name="planId" required>{plans.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><div className="grid2"><label>Capital (MXN)<input name="principal" type="number" min="0.01" step="0.01" required/></label><label>Fecha de entrega<input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}/></label></div>{error && <p className="error">{error}</p>}<button disabled={!clients.length || !plans.length}>Crear préstamo y calendario</button></form>; }
export function PaymentForm({ loanId }: {
    loanId: string;
}) { const [error, setError] = useState(''); return <form className="panel form" onSubmit={async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); const r = await fetch(`/api/v1/loans/${loanId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(f) }); if (!r.ok) {
    setError((await r.json()).error ?? 'No se pudo registrar');
    return;
} location.reload(); }}><h2>Registrar abono</h2><div className="grid2"><label>Importe<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Fecha<input name="effectiveDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}/></label></div><label>Nota<input name="note"/></label>{error && <p className="error">{error}</p>}<button>Confirmar pago</button></form>; }
