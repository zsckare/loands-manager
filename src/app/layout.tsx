import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Loans Manager', description: 'Gestión de préstamos, abonos y cobranza' };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="es"><body>{children}</body></html>; }
