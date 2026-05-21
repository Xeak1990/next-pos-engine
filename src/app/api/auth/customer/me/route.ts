import { NextResponse } from 'next/server';
import { getCustomerFromCookies } from '../../../../../lib/customer-auth-utils';

export async function GET() {
  const customer = await getCustomerFromCookies();
  if (!customer) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
    },
  });
}