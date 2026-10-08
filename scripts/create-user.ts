import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
async function main() { const [email, password, name = 'Administrador'] = process.argv.slice(2); if (!email || !password || password.length < 12)
    throw new Error('Usage: npm run user:create -- email password(12+ chars) [name]'); const salt = randomBytes(16).toString('hex'); const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }); try {
    await db.user.create({ data: { email: email.toLowerCase(), name, passwordHash } });
    console.log('User created');
}
finally {
    await db.$disconnect();
} }
main().catch(e => { console.error(e); process.exit(1); });
