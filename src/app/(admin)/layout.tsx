
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { currentUserId } from "@/lib/auth";
import { Logout } from "@/components/logout";

interface AdminLayoutProps {
    children: React.ReactNode;
}

/**
 * Main layout for authenticated administration pages.
 *
 * Suspense isolates session-dependent rendering so that
 * Next.js can safely prerender the outer route shell.
 */
export default function AdminLayout({
    children,
}: AdminLayoutProps) {
    return (
        <Suspense fallback={<AdminLayoutLoading />}>
            <AuthenticatedAdminLayout>
                {children}
            </AuthenticatedAdminLayout>
        </Suspense>
    );
}

/**
 * Validates the active session before rendering the
 * administration navigation and protected content.
 */
async function AuthenticatedAdminLayout({
    children,
}: AdminLayoutProps) {
    const userId = await currentUserId();

    if (!userId) {
        redirect("/login");
    }

    return (
        <div className="shell">
            <aside className="sidebar">
                <h2>◈ Loans Manager</h2>

                <nav>
                    <Link href="/dashboard">
                        Dashboard
                    </Link>

                    <Link href="/clients">
                        Clientes
                    </Link>

                    <Link href="/plans">
                        Planes
                    </Link>

                    <Link href="/loans">
                        Préstamos
                    </Link>

                    <Link href="/collections">
                        Cobranza
                    </Link>
                </nav>

                <Logout />
            </aside>

            <main className="content">
                {children}
            </main>
        </div>
    );
}

/**
 * Non-sensitive fallback displayed while the server
 * validates the user's session.
 */
function AdminLayoutLoading() {
    return (
        <div className="shell">
            <aside className="sidebar">
                <h2>◈ Loans Manager</h2>
                <p>Verificando sesión...</p>
            </aside>

            <main className="content">
                <p>Cargando...</p>
            </main>
        </div>
    );
}
