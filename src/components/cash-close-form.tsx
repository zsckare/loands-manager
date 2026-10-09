"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Touch-friendly daily cash close form. / Formulario táctil de cierre diario. */
export function CashCloseForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("¿Confirmas el cierre? No se podrán registrar más movimientos con fecha de hoy.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/cash/close", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countedBalance: amount, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No fue posible cerrar caja");
      setAmount("");
      setNote("");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error inesperado"); }
    finally { setBusy(false); }
  }
  return <section className="panel">
    <h2>Cierre diario de caja</h2>
    <p>Captura el efectivo contado y compara con el balance acumulado registrado.</p>
    <form onSubmit={submit} className="mobile-form">
      <label>Saldo contado (MXN)
        <input inputMode="decimal" required value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" />
      </label>
      <label>Observaciones
        <textarea value={note} maxLength={300} onChange={event => setNote(event.target.value)} />
      </label>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Cerrando..." : "Cerrar caja de hoy"}</button>
    </form>
  </section>;
}
