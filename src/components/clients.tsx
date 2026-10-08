'use client';
import { useState } from 'react';
export function ClientForm() { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); return <form className="panel form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const data = Object.fromEntries(new FormData(e.currentTarget)); const r = await fetch('/api/v1/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); setBusy(false); if (!r.ok) {
    setError('No se pudo guardar el cliente');
    return;
} location.reload(); }}><h2>Nuevo cliente</h2><div className="grid2"><label>Nombre<input name="firstName" required/></label><label>Apellidos<input name="lastName" required/></label></div><label>Teléfono<input name="phone"/></label><label>Dirección<input name="address"/></label><label>Notas<textarea name="notes"/></label>{error && <p className="error">{error}</p>}<button disabled={busy}>Guardar cliente</button></form>; }
