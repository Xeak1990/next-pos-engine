import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const host = request.headers.get('host') || '';
  const domain = host.includes('localhost') || host.includes('127.0.0.1')
    ? undefined
    : host.split('https://next-pos-engine-g6vdwpv25-axel-yahir-s-projects.vercel.app/')[0]; // dominio real (ej: next-pos-engine.vercel.app)

  const cookieOptions = {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
    ...(domain && { domain }),
  };

  response.cookies.set('bt_auth', '', cookieOptions);
  response.cookies.set('bt_customer_token', '', cookieOptions);
  return response;
}