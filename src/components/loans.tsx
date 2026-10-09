"use client";

import { useRef, useState } from "react";

type Option = { id: string; name: string };

/** Loan creation form / Formulario para crear préstamos. */
export function LoanForm({ clients, plans }: { clients: Option[]; plans: Option[] }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const input = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/v1/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Error al crear préstamo");
      window.location.assign(`/loans/${result.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Nuevo préstamo</h2>
      <label>Cliente
        <select name="clientId" required>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <label>Plan
        <select name="planId" required>{plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <div className="grid2">
        <label>Capital (MXN)<input name="principal" type="number" inputMode="decimal" min="0.01" step="0.01" required /></label>
        <label>Fecha de entrega<input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={busy || !clients.length || !plans.length}>
        {busy ? "Guardando..." : "Crear préstamo y calendario"}
      </button>
    </form>
  );
}

/**
 * Preserve one idempotency key across network retries.
 * Conserva la misma clave ante reintentos para evitar cobros duplicados.
 */
export function PaymentForm({ loanId }: { loanId: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestKey = useRef<string | null>(null);
  const payload = useRef<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const currentPayload = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
    if (payload.current !== currentPayload || !requestKey.current) {
      payload.current = currentPayload;
      requestKey.current = crypto.randomUUID();
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/loans/${loanId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey.current,
        },
        body: currentPayload,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo registrar el pago");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Registrar abono</h2>
      <div className="grid2">
        <label>Importe (MXN)<input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required /></label>
        <label>Fecha<input name="effectiveDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
      </div>
      <label>Nota<input name="note" /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Registrando..." : "Confirmar pago"}</button>
    </form>
  );
}
