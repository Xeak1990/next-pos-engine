import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/auth-utils";
import { verifyAuthToken } from "../../../lib/token-utils";

const ADMIN_ROLE = "ADMIN";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload || authPayload.role !== ADMIN_ROLE) {
    return null;
  }

  return authPayload;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        store: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
            location: user.store.location,
          }
        : null,
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role, storeId, isActive } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos los campos obligatorios deben completarse" }, { status: 400 });
    }

    if ((role === "CASHIER" || role === "MANAGER") && !storeId) {
      return NextResponse.json({ error: "La sucursal es obligatoria para MANAGER y CASHIER" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: typeof isActive === "boolean" ? isActive : true,
        storeId: storeId || undefined,
      },
      include: {
        store: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
            location: user.store.location,
          }
        : null,
    });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, email, password, role, storeId, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    if ((role === "CASHIER" || role === "MANAGER") && !storeId) {
      return NextResponse.json({ error: "La sucursal es obligatoria para MANAGER y CASHIER" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (role) data.role = role;
    if (password) data.password = await hashPassword(password);
    if (role === "ADMIN") {
      data.storeId = null;
    } else if (storeId) {
      data.storeId = storeId;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        store: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
            location: user.store.location,
          }
        : null,
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
