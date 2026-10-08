'use client';
export function Logout() { return <button className="secondary" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/login'; }}>Cerrar sesión</button>; }
