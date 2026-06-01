// src/lib/customer-auth-utils.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getCustomerSecret } from "./secret";

// ============================================================
// Interfaces
// ============================================================
export type CustomerPayload = {
  id: string;
  email: string;
  role: "customer";
};

// ============================================================
// Firmar token para clientes
// ============================================================
export async function generateCustomerToken(customerId: string, email: string): Promise<string> {
  const payload: CustomerPayload = {
    id: customerId,
    email,
    role: "customer",
  };
  const secret = getCustomerSecret();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

// ============================================================
// Verificar token para clientes
// ============================================================
export async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  try {
    const secret = getCustomerSecret();
    const { payload } = await jwtVerify<CustomerPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// Obtener cliente completo desde la cookie (para API routes)
// ============================================================
export async function getCustomerFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_customer_token")?.value;
  if (!token) return null;
  const payload = await verifyCustomerToken(token);
  if (!payload) return null;
  const customer = await prisma.customer.findUnique({
    where: { id: payload.id },
  });
  return customer;
}