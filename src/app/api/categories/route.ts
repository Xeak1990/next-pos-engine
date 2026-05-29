import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
function normalizeCategoryName(name: string): string {
    
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error GET /api/categories:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Nombre de categoría requerido" },
        { status: 400 },
      );
    }
    const normalized = normalizeCategoryName(name);
    const existing = await prisma.category.findFirst({
      where: { name: { equals: normalized, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `La categoría "${normalized}" ya existe` },
        { status: 400 },
      );
    }
    const slug = normalized
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    const category = await prisma.category.create({
      data: { name: normalized, slug },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error POST /api/categories:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
