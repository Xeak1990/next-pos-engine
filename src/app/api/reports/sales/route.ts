import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "../../../../lib/token-utils";

function parseDateQuery(value: string | null, fallback: Date) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    // 1. Autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get("bt_auth")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyAuthToken(token);
    if (!payload || (payload.role !== "ADMIN" && payload.role !== "MANAGER")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // 2. Parámetros de fecha
    const url = new URL(request.url);
    let startDate = parseDateQuery(url.searchParams.get("startDate"), new Date());
    let endDate = parseDateQuery(url.searchParams.get("endDate"), new Date());

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) [startDate, endDate] = [endDate, startDate];

    const dateFilter = { createdAt: { gte: startDate, lte: endDate } };

    // 3. Totales
    const totalAgg = await prisma.sale.aggregate({
      where: dateFilter,
      _sum: { total: true },
      _count: true,
    });
    const totalSales = Number(totalAgg._sum.total || 0);
    const totalTransactions = totalAgg._count;
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // 4. Ventas por sucursal
    const salesByStoreRaw = await prisma.sale.groupBy({
      by: ["storeId"],
      where: dateFilter,
      _sum: { total: true },
      _count: true,
    });
    const storeIds = salesByStoreRaw.map(s => s.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    });
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));
    const salesByStore = salesByStoreRaw.map(s => ({
      store: storeMap[s.storeId] || "Desconocido",
      sales: Number(s._sum.total || 0),
      transactions: s._count,
    }));

    // 5. Top productos más vendidos
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: dateFilter },
      select: {
        quantity: true,
        salePrice: true,
        variant: {
          select: {
            size: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const topMap = new Map<string, { modelName: string; size: string; quantity: number; total: number }>();
    for (const item of saleItems) {
      const key = `${item.variant.product.name}-${item.variant.size}`;
      const qty = item.quantity;
      const total = Number(item.salePrice) * qty;
      const existing = topMap.get(key);
      if (existing) {
        existing.quantity += qty;
        existing.total += total;
      } else {
        topMap.set(key, {
          modelName: item.variant.product.name,
          size: item.variant.size,
          quantity: qty,
          total,
        });
      }
    }
    const topSellers = Array.from(topMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 6. Tendencia diaria
    const allSales = await prisma.sale.findMany({
      where: dateFilter,
      select: { total: true, createdAt: true },
    });
    const trendMap = new Map<string, number>();
    for (const sale of allSales) {
      const dateKey = formatISODate(sale.createdAt);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + Number(sale.total));
    }
    const salesTrend = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = formatISODate(current);
      salesTrend.push({ date: key, total: trendMap.get(key) || 0 });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTicket,
      salesByStore,
      topSellers,
      salesTrend,
      range: {
        startDate: formatISODate(startDate),
        endDate: formatISODate(endDate),
      },
    });
  } catch (error) {
    console.error("Error en API de reportes de ventas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}