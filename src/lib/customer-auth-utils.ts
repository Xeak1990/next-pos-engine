import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const CUSTOMER_TOKEN_NAME = 'bt_customer_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateCustomerToken(customerId: string, email: string): string {
  return jwt.sign({ id: customerId, email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyCustomerToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getCustomerFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_NAME)?.value;
  if (!token) return null;
  const payload = verifyCustomerToken(token);
  if (!payload) return null;
  const customer = await prisma.customer.findUnique({ where: { id: payload.id } });
  return customer;
}