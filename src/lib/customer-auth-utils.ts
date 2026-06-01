// src/lib/customer-auth-utils.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getCustomerSecret } from "./secret";

export type CustomerPayload = {
  id: string;
  email: string;
  role: "customer";
};

export async function generateCustomerToken(customerId: string, email: string): Promise<string> {
  console.log("[generateCustomerToken] Iniciando para customerId:", customerId, "email:", email);
  const payload: CustomerPayload = { id: customerId, email, role: "customer" };
  const secret = getCustomerSecret();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  console.log("[generateCustomerToken] Token generado (primeros 20 chars):", token.substring(0, 20));
  return token;
}

export async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  console.log("[verifyCustomerToken] Verificando token (primeros 20):", token.substring(0, 20));
  try {
    const secret = getCustomerSecret();
    const { payload } = await jwtVerify<CustomerPayload>(token, secret);
    console.log("[verifyCustomerToken] Token válido, payload:", payload);
    return payload;
  } catch (err) {
    console.error("[verifyCustomerToken] Error al verificar token:", err);
    return null;
  }
}

export async function getCustomerFromCookies() {
  console.log("[getCustomerFromCookies] Obteniendo cookie bt_customer_token");
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_customer_token")?.value;
  if (!token) {
    console.log("[getCustomerFromCookies] No se encontró cookie");
    return null;
  }
  console.log("[getCustomerFromCookies] Cookie encontrada, token primeros 20:", token.substring(0, 20));
  const payload = await verifyCustomerToken(token);
  if (!payload) {
    console.log("[getCustomerFromCookies] Token inválido");
    return null;
  }
  const customer = await prisma.customer.findUnique({ where: { id: payload.id } });
  if (!customer) {
    console.log("[getCustomerFromCookies] Cliente no encontrado en BD con id:", payload.id);
  } else {
    console.log("[getCustomerFromCookies] Cliente encontrado:", customer.email);
  }
  return customer;
}