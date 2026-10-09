"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/clients", label: "Clientes", icon: "♙" },
  { href: "/plans", label: "Planes", icon: "▤" },
  { href: "/loans", label: "Préstamos", icon: "◈" },
  { href: "/collections", label: "Cobranza", icon: "◷" },
  { href: "/receipts", label: "Recibos", icon: "▧" },
  { href: "/cash", label: "Caja", icon: "▣" },
  { href: "/staff", label: "Equipo", icon: "♧" },
  { href: "/reports", label: "Reportes", icon: "▥" },
];

/** Responsive navigation shared across desktop, tablet and phone. */
export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? "Cerrar ✕" : "Menú ☰"}</button>
    <nav id="main-nav" className={open ? "nav-links nav-open" : "nav-links"} aria-label="Navegación principal">
      {links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined} onClick={() => setOpen(false)}><span aria-hidden="true">{link.icon}</span>{link.label}</Link>)}
    </nav>
  </>;
}
