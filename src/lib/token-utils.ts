// src/lib/token-utils.ts
import { SignJWT, jwtVerify } from "jose";
import { getEmployeeSecret } from "./secret";

// ============================================================
// Configuración de tiempo de expiración
// ============================================================
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 horas

// ============================================================
// Interfaces
// ============================================================
export type AuthPayload = {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  storeId: string | null;
  storeName?: string | null;
  storeLocation?: string | null;
};

// ============================================================
// Firmar token (empleados)
// ============================================================
export async function signAuthToken(payload: AuthPayload): Promise<string> {
  const secret = getEmployeeSecret();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret);
  return token;
}

// ============================================================
// Verificar token (empleados)
// ============================================================
export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    const secret = getEmployeeSecret();
    const { payload } = await jwtVerify<AuthPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// Obtener payload desde cookies (server component / middleware)
// ============================================================
export async function getAuthPayloadFromCookies(
  cookieStore: { get(name: string): { value: string } | undefined }
): Promise<AuthPayload | null> {
  const cookie = cookieStore.get("bt_auth");
  if (!cookie) return null;
  return verifyAuthToken(cookie.value);
}