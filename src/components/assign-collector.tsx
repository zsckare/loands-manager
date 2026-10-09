"use client";
import { useState } from "react";
type Option = { id: string; name: string };
export function AssignCollector({ clients, collectors }: { clients: Option[]; collectors: Option[] }) {
  const [message, setMessage] = useState("");
  return <form className="panel form" onSubmit={async (event) => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/v1/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    setMessage(response.ok ? "Asignación guardada" : (await response.json()).error ?? "Error al asignar");
  }}>
    <h2>Asignar cliente a cobrador</h2>
    <div className="grid2"><label>Cliente<select name="clientId" required>{clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Cobrador<select name="collectorId" required>{collectors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>
    {message && <p role="status">{message}</p>}
    <button disabled={!clients.length || !collectors.length}>Guardar asignación</button>
  </form>;
}
