import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCustomerFromCookies } from '../../../../lib/customer-auth-utils';

export async function GET() {
  const customer = await getCustomerFromCookies();
  if (!customer) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}