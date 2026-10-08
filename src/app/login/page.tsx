'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Login() { const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); return <main className="login"><form className="panel form" onSubmit={async (e) => { e.preventDefault(); setError(''); const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (!r.ok) {
    setError('Credenciales incorrectas');
    return;
} router.push('/dashboard'); router.refresh(); }}><h1>Loans Manager</h1><p>Inicia sesión para administrar tus préstamos</p><label>Correo<input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Contraseña<input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p className="error">{error}</p>}<button>Ingresar</button></form></main>; }
