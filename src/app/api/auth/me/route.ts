import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "../../../../lib/token-utils";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Envolver el payload en una propiedad "customer"
  return NextResponse.json({ customer: authPayload });
}