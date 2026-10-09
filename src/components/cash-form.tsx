"use client";
import { useState } from "react";
export function CashForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="panel form" onSubmit={async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/v1/cash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "No se pudo registrar"); }
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado"); }
    finally { setBusy(false); }
  }}>
    <h2>Movimiento manual</h2>
    <label>Tipo<select name="type"><option value="INCOME">Ingreso</option><option value="EXPENSE">Egreso</option></select></label>
    <label>Importe (MXN)<input type="number" name="amount" min="0.01" step="0.01" required /></label>
    <label>Concepto<input name="description" maxLength={240} required /></label>
    {error && <p className="error" role="alert">{error}</p>}
    <button disabled={busy}>{busy ? "Guardando..." : "Registrar movimiento"}</button>
  </form>;
}
