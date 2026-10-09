
import { scryptSync, timingSafeEqual } from "node:crypto";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

/**
 * Verify a password against the stored hash.
 *
 * Verifica contraseñas bcrypt (usuarios nuevos) y
 * scrypt (usuarios creados con la implementación anterior).
 */
async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    // New accounts created by prisma/seed.ts use bcrypt.
    // Las cuentas nuevas creadas por el seed utilizan bcrypt.
    if (/^\$2[aby]\$/.test(storedHash)) {
        return compare(password, storedHash);
    }

    // Legacy accounts use the format "salt:hash".
    // Las cuentas anteriores utilizan el formato "salt:hash".
    const [salt, hash] = storedHash.split(":");

    if (
        !salt ||
        !hash ||
        !/^[0-9a-f]{128}$/i.test(hash)
    ) {
        return false;
    }

    const calculatedHash = scryptSync(password, salt, 64);
    const expectedHash = Buffer.from(hash, "hex");

    return (
        calculatedHash.length === expectedHash.length &&
        timingSafeEqual(calculatedHash, expectedHash)
    );
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a signed session cookie.
 *
 * Autentica al usuario y crea una cookie de sesión firmada.
 */
export async function POST(request: Request) {
    try {
        const body: unknown = await request.json();

        if (
            typeof body !== "object" ||
            body === null ||
            !("email" in body) ||
            !("password" in body)
        ) {
            return invalidCredentials();
        }

        const { email, password } = body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return invalidCredentials();
        }

        // Normalize the email before querying PostgreSQL.
        // Normalizamos el correo antes de consultar PostgreSQL.
        const normalizedEmail = email.trim().toLowerCase();

        const user = await db.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return invalidCredentials();
        }

        // Verify the password using the appropriate algorithm.
        // Verificamos la contraseña con el algoritmo correspondiente.
        const isValidPassword = await verifyPassword(
            password,
            user.passwordHash
        );

        if (!isValidPassword) {
            return invalidCredentials();
        }

        // Create the authenticated session.
        // Creamos la sesión autenticada.
        await setSession(user.id);

        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.error("Login failed:", error);

        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}

/**
 * Return a generic authentication error.
 *
 * Evita revelar si el correo existe en la base de datos.
 */
function invalidCredentials() {
    return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
    );
}
