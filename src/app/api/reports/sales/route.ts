import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function parseDateQuery(value: string | null, fallback: Date) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const startDateQuery = url.searchParams.get("startDate");
    const endDateQuery = url.searchParams.get("endDate");

    let startDate = parseDateQuery(startDateQuery, new Date());
    let endDate = parseDateQuery(endDateQuery, new Date());

    startDate = new Date(startDate.setHours(0, 0, 0, 0));
    endDate = new Date(endDate.setHours(23, 59, 59, 999));

    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const totalSalesResult = await prisma.sale.aggregate({
      where: dateFilter,
      _sum: { total: true },
      _count: true,
    });

    const totalSales = totalSalesResult._sum.total ? Number(totalSalesResult._sum.total) : 0;
    const totalTransactions = totalSalesResult._count;
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    const salesByStore = await prisma.sale.groupBy({
      by: ["storeId"],
      where: dateFilter,
      _sum: { total: true },
      _count: true,
    });

    const storeIds = salesByStore.map((s) => s.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    });

    const storeMap = stores.reduce((acc, store) => {
      acc[store.id] = store.name;
      return acc;
    }, {} as Record<string, string>);

    const salesByStoreFormatted = salesByStore.map((s) => ({
      store: storeMap[s.storeId] || 'Desconocido',
      sales: s._sum.total ? Number(s._sum.total) : 0,
      transactions: s._count,
    }));

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        quantity: true,
        salePrice: true,
        variant: {
          select: {
            id: true,
            size: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const topSellerMap = new Map<string, { modelName: string; size: string; quantity: number; total: number }>();

    saleItems.forEach((item) => {
      const key = item.variant.id;
      const quantity = item.quantity;
      const total = Number(item.salePrice) * quantity;
      const modelName = item.variant.product.name;
      const size = item.variant.size;
      const existing = topSellerMap.get(key);

      if (existing) {
        existing.quantity += quantity;
        existing.total += total;
      } else {
        topSellerMap.set(key, {
          modelName,
          size,
          quantity,
          total,
        });
      }
    });

    const topSellers = Array.from(topSellerMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const trendRows = await prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt") AS day, SUM("total") AS total
      FROM "Sale"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY day
      ORDER BY day
    `;

    const trendMap = new Map<string, number>(
      (trendRows as Array<{ day: Date; total: string | number }>).map((row) => [
        formatISODate(new Date(row.day)),
        Number(row.total),
      ])
    );

    const salesTrend: Array<{ date: string; total: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const key = formatISODate(currentDate);
      salesTrend.push({
        date: key,
        total: trendMap.get(key) ?? 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTicket,
      salesByStore: salesByStoreFormatted,
      topSellers,
      salesTrend,
      range: {
        startDate: formatISODate(startDate),
        endDate: formatISODate(endDate),
      },
    });
  } catch (error) {
    console.error("Error en API de reportes de ventas:", error);
    return NextResponse.json({ error: "Error al cargar reportes" }, { status: 500 });
  }
}
