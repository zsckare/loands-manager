
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

/**
 * Initial database seed for Loans Manager.
 *
 * Creates the first administrator account if it does not exist.
 * The script is idempotent and does not overwrite existing users.
 *
 * Seed inicial de la base de datos.
 * Crea el primer administrador sin duplicar usuarios existentes.
 */

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminName =
        process.env.SEED_ADMIN_NAME ?? "Administrator";

    // Validate required environment variables.
    if (!databaseUrl) {
        throw new Error(
            "DATABASE_URL environment variable is required."
        );
    }

    if (!adminEmail || !adminPassword) {
        throw new Error(
            "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required."
        );
    }

    if (adminPassword.length < 12) {
        throw new Error(
            "Administrator password must contain at least 12 characters."
        );
    }

    // Initialize Prisma 7 with the PostgreSQL adapter.
    const adapter = new PrismaPg({
        connectionString: databaseUrl,
    });

    const prisma = new PrismaClient({
        adapter,
    });

    try {
        const normalizedEmail = adminEmail.trim().toLowerCase();

        // Avoid modifying an account that already exists.
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
            select: {
                id: true,
                email: true,
            },
        });

        if (existingUser) {
            console.log(
                `Administrator already exists: ${existingUser.email}`
            );

            return;
        }

        // Hash the password before storing it in PostgreSQL.
        const passwordHash = await hash(adminPassword, 12);

        const administrator = await prisma.user.create({
            data: {
                name: adminName.trim(),
                email: normalizedEmail,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        console.log("Administrator created successfully.");
        console.log(`ID: ${administrator.id}`);
        console.log(`Name: ${administrator.name}`);
        console.log(`Email: ${administrator.email}`);
    } finally {
        // Always release database connections.
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
});
