import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const COOKIE_NAME = "loans_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

/**
 * Get the server-side signing secret.
 * Obtiene la clave privada utilizada para firmar las sesiones.
 */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return secret;
}

/**
 * Sign a session payload with HMAC-SHA256.
 * Firma el contenido de la sesión con HMAC-SHA256.
 */
function sign(value: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("hex");
}

/**
 * Read and validate the authenticated user ID.
 * Lee y valida el identificador del usuario autenticado.
 *
 * connection() ensures that time-sensitive authentication logic
 * runs for an actual request rather than during prerendering.
 *
 * connection() garantiza que la validación de la sesión se ejecute
 * durante una petición real, no durante el prerenderizado.
 */
export async function currentUserId(): Promise<string | null> {
  await connection();

  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token || !process.env.AUTH_SECRET) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userId, expires, signature] = parts;

  if (
    !userId ||
    !/^\d+$/.test(expires) ||
    !/^[0-9a-f]{64}$/i.test(signature)
  ) {
    return null;
  }

  const expiresAt = Number(expires);

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  const expectedSignature = Buffer.from(
    sign(`${userId}.${expires}`),
    "hex"
  );
  const receivedSignature = Buffer.from(signature, "hex");

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  return userId;
}

/**
 * Create a signed, HTTP-only session cookie.
 * Crea una cookie de sesión firmada y no accesible desde JavaScript.
 */
export async function setSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${userId}.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Remove the current session cookie.
 * Elimina la cookie de sesión actual.
 */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
