"use client";
/** Browser-native print supports PDF export on desktop, phone and tablet. */
export function PrintReceipt() {
  return <button type="button" onClick={() => window.print()}>Imprimir / Guardar PDF</button>;
}
