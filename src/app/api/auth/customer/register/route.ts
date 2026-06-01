import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { hashPassword } from '../../../../../lib/auth-utils';           // ✅ importación correcta
import { generateCustomerToken } from '../../../../../lib/customer-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, address, city, postalCode } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashed,
        name,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
      },
    });

    const token = await generateCustomerToken(customer.id, customer.email); // ✅ agregar await
    const response = NextResponse.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email } });
    response.cookies.set('bt_customer_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}