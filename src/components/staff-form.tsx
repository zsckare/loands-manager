"use client";
import { useState } from "react";
export function StaffForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="panel form" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const input = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/v1/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) throw new Error((await response.json()).error ?? "No se pudo crear");
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado"); }
    finally { setBusy(false); }
  }}>
    <h2>Agregar integrante</h2>
    <label>Nombre<input name="name" required minLength={2} /></label>
    <label>Correo<input name="email" type="email" required /></label>
    <label>Contraseña temporal (12+ caracteres)<input name="password" type="password" minLength={12} required autoComplete="new-password" /></label>
    <label>Rol<select name="role"><option value="COLLECTOR">Cobrador</option><option value="SUPERVISOR">Supervisor</option></select></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button disabled={busy}>{busy ? "Creando..." : "Crear usuario"}</button>
  </form>;
}
