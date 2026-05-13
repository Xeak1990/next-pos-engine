import { cookies } from "next/headers";
import SalesChart from "../../../components/admin/SalesChart";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { formatCurrency } from "../../../lib/utils";

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("es-MX", { weekday: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload) {
    return <div className="p-8 text-white">Unauthorized</div>;
  }

  const { role, storeId, storeName } = authPayload;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const salesWhere = role === "MANAGER" && storeId ? { storeId } : {};
  const inventoryWhere = role === "MANAGER" && storeId ? { storeId } : {};

  const [
    salesToday,
    transactionsToday,
    lowStockCount,
    storesCount,
    lowStockList,
    recentSales,
    weeklySales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true },
      where: {
        ...salesWhere,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.sale.count({
      where: {
        ...salesWhere,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.inventory.count({
      where: {
        ...inventoryWhere,
        quantity: { lte: 2 },
      },
    }),
    role === "ADMIN" ? prisma.store.count() : 1,
    prisma.inventory.findMany({
      where: {
        ...inventoryWhere,
        quantity: { lte: 2 },
      },
      include: {
        store: true,
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [{ quantity: "asc" }],
      take: 4,
    }),
    prisma.sale.findMany({
      where: salesWhere,
      include: {
        store: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.sale.findMany({
      where: {
        ...salesWhere,
        createdAt: {
          gte: startOfWeek,
          lte: endOfToday,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const weeklyChart = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    const total = weeklySales
      .filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.toDateString() === date.toDateString();
      })
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      label: dayLabel(date),
      value: total,
    };
  });

  const metrics = [
    {
      name: "VENTAS HOY",
      value: formatCurrency(Number(salesToday._sum.total || 0)),
      accent: "text-[#2ECC71]",
      note: "Actualizado al momento",
    },
    {
      name: "TRANSACCIONES",
      value: transactionsToday.toString(),
      accent: "text-[#E8621A]",
      note: "Operaciones registradas",
    },
    {
      name: "STOCK BAJO",
      value: lowStockCount.toString(),
      accent: "text-[#E8621A]",
      note: "Productos en alerta",
    },
    {
      name: "SUCURSALES",
      value: storesCount.toString(),
      accent: "text-[#2ECC71]",
      note: role === "ADMIN" ? "Vista global" : "Vista asignada",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-[#94A3B8]">Centro de Control</p>
            <h1 className="mt-3 text-5xl text-white">Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#9CA3AF]">
              Resumen operativo de Ben Tenison con foco en ventas, stock y sucursales activas.
            </p>
          </div>

          <div className="bt-panel-blue px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C9D8EA]">Cobertura actual</p>
            <p className="mt-2 font-mono text-sm text-white">
              {role === "ADMIN" ? "Administracion Global" : storeName || "Sucursal Asignada"}
            </p>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.name} className="bt-panel px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">{metric.name}</p>
                  <p className={`mt-4 font-mono text-3xl font-bold ${metric.accent}`}>{metric.value}</p>
                </div>
                <span className="mt-1 h-3 w-3 rounded-full bg-[#E8621A]" />
              </div>
              <p className="mt-4 text-sm text-[#9CA3AF]">{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <SalesChart points={weeklyChart} />

          <div className="space-y-6">
            <article className="bt-panel p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">Alertas</p>
              <h2 className="mt-3 text-3xl text-white">Stock Bajo</h2>

              {lowStockList.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {lowStockList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {item.variant.product.name}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">
                            {item.store.name} / talla {item.variant.size}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#E8621A]/30 bg-[#E8621A]/12 px-3 py-1 font-mono text-xs text-[#E8621A]">
                          {item.quantity} uds
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-5 text-sm text-[#D1FAE5]">
                  No hay productos en estado critico.
                </div>
              )}
            </article>

            <article className="bt-panel p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">Actividad</p>
              <h2 className="mt-3 text-3xl text-white">Ventas Recientes</h2>

              <div className="mt-5 space-y-3">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-4"
                    >
                      <div>
                        <p className="font-mono text-sm text-white">{sale.store.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">
                          {new Intl.DateTimeFormat("es-MX", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(sale.createdAt)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#2ECC71]">
                        {formatCurrency(Number(sale.total))}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-5 text-sm text-[#9CA3AF]">
                    Sin ventas registradas todavia.
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
