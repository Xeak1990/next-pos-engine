import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    // Obtener métricas generales
    const totalSalesResult = await prisma.sale.aggregate({
      _sum: { total: true },
      _count: true,
    });

    const totalSales = totalSalesResult._sum.total ? Number(totalSalesResult._sum.total) : 0;
    const totalTransactions = totalSalesResult._count;

    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Ventas por sucursal
    const salesByStore = await prisma.sale.groupBy({
      by: ['storeId'],
      _sum: { total: true },
      _count: true,
    });

    // Obtener nombres de sucursales
    const storeIds = salesByStore.map(s => s.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    });

    const storeMap = stores.reduce((acc, store) => {
      acc[store.id] = store.name;
      return acc;
    }, {} as Record<string, string>);

    const salesByStoreFormatted = salesByStore.map(s => ({
      store: storeMap[s.storeId] || 'Desconocido',
      sales: s._sum.total ? Number(s._sum.total) : 0,
      transactions: s._count,
    }));

    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTicket,
      salesByStore: salesByStoreFormatted,
    });
  } catch (error) {
    console.error("Error en API de reportes de ventas:", error);
    return NextResponse.json({ error: "Error al cargar reportes" }, { status: 500 });
  }
}