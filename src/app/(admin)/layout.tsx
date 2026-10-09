import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { currentUserId } from "@/lib/auth";
import { Logout } from "@/components/logout";
import { MobileNavigation } from "@/components/mobile-navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Render the administration shell behind a Suspense boundary.
 * Muestra el panel administrativo dentro de un límite de Suspense.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<AdminLayoutLoading />}>
      <AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout>
    </Suspense>
  );
}

/**
 * Validate the session at request time before showing protected content.
 * Valida la sesión durante la petición antes de mostrar contenido privado.
 */
async function AuthenticatedAdminLayout({
  children,
}: AdminLayoutProps) {
  await connection();

  const userId = await currentUserId();

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h2>◈ Loans Manager</h2>

        <MobileNavigation />

        <Logout />
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}

/**
 * Public loading shell displayed while authentication is checked.
 * Estructura temporal sin datos privados mientras se valida la sesión.
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
