import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { formatCurrency } from "../../../lib/utils";

function formatLowercaseDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toLowerCase();
}

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatVsYesterday(current: number, previous: number) {
  if (previous === 0 && current === 0) {
    return "vs ayer 0%";
  }

  if (previous === 0) {
    return "vs ayer +100%";
  }

  const diff = ((current - previous) / previous) * 100;
  const signal = diff >= 0 ? "+" : "";
  return `vs ayer ${signal}${diff.toFixed(0)}%`;
}

function createChartPoints(values: number[]) {
  const width = 560;
  const height = 180; // Altura reducida para evitar scroll
  const paddingX = 28;
  const paddingTop = 18;
  const paddingBottom = 28;
  const maxValue = Math.max(...values, 1);
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  return values.map((value, index) => {
    const x = paddingX + (innerWidth / Math.max(values.length - 1, 1)) * index;
    const y = paddingTop + innerHeight - (value / maxValue) * innerHeight;
    return { x, y, value };
  });
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

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(startOfYesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const startOfWeek = getMonday(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const salesWhere = role === "MANAGER" && storeId ? { storeId } : {};
  const inventoryWhere = role === "MANAGER" && storeId ? { storeId } : {};

  const [
    salesToday,
    salesYesterday,
    transactionsToday,
    lowStockCount,
    outOfStockCount,
    storesCount,
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
    prisma.sale.aggregate({
      _sum: { total: true },
      where: {
        ...salesWhere,
        createdAt: {
          gte: startOfYesterday,
          lte: endOfYesterday,
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
    prisma.inventory.count({
      where: {
        ...inventoryWhere,
        quantity: 0,
      },
    }),
    role === "ADMIN" ? prisma.store.count() : 1,
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
          lte: endOfWeek,
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

  const weekdays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const weeklyChart = weekdays.map((label, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    const value = weeklySales
      .filter(
        (sale) =>
          new Date(sale.createdAt).toDateString() === date.toDateString(),
      )
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    return { label, value };
  });

  const chartCoordinates = createChartPoints(
    weeklyChart.map((point) => point.value),
  );
  const chartPolyline = chartCoordinates
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const salesTodayValue = Number(salesToday._sum.total || 0);
  const salesYesterdayValue = Number(salesYesterday._sum.total || 0);
  const activeStoreLabel =
    role === "MANAGER" ? storeName || "Sucursal activa" : "Operativas";
  const storeRatio =
    role === "MANAGER" ? "1/1" : `${storesCount}/${storesCount}`;

  return (
    <div className="min-h-screen w-full bg-[#060606] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center rounded-full border border-[#222222] bg-[#111111] px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-[#A1A1AA]">
            BT · Dashboard
          </span>
          <h1 className="font-['Arial'] text-[32px] font-bold uppercase tracking-[0.18em] text-white leading-none">
            Dashboard
          </h1>
          <p className="text-sm font-[Arial] text-[#9CA3AF]">
            {formatLowercaseDate(now)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#111111] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#191919]"
          >
            📊 Reportes
          </Link>
          <Link
            href="/terminal"
            className="bt-button-primary rounded-[14px] text-xs uppercase tracking-[0.18em]"
          >
            Abrir POS
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-4 gap-6 mb-8">
        <article className="bt-panel rounded-[22px] p-4 flex flex-col justify-between shadow-[0_12px_30px_rgba(0,0,0,0.22)] min-h-[140px]">
          <div className="flex justify-between items-start gap-3">
            <p className="pl-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]">
              VENTAS HOY
            </p>
            <span className="text-sm">💰</span>
          </div>
          <div className="mt-3">
            <p className="font-[Arial] text-[22px] font-bold text-white leading-none">
              {formatCurrency(salesTodayValue)}
            </p>
            <p className="mt-1 pl-1 text-[10px] text-[#9CA3AF] uppercase tracking-[0.22em]">
              {formatVsYesterday(salesTodayValue, salesYesterdayValue)}
            </p>
          </div>
        </article>

        <article className="bt-panel rounded-[22px] p-4 flex flex-col justify-between shadow-[0_12px_30px_rgba(0,0,0,0.22)] min-h-[140px]">
          <div className="flex justify-between items-start gap-3">
            <p className="pl-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]">
              TRANSACCIONES
            </p>
            <span className="text-sm text-[#9CA3AF]">📄</span>
          </div>
          <div className="mt-3">
            <p className="font-[Arial] text-[22px] font-bold text-white leading-none">
              {transactionsToday}
            </p>
            <p className="mt-1 pl-1 text-[10px] text-[#9CA3AF] uppercase tracking-[0.22em]">Hoy</p>
          </div>
        </article>

        <article className="bt-panel rounded-[22px] p-4 flex flex-col justify-between shadow-[0_12px_30px_rgba(0,0,0,0.22)] min-h-[140px]">
          <div className="flex justify-between items-start gap-3">
            <p className="pl-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]">
              STOCK BAJO
            </p>
            <span className="text-sm text-[#F39C12]">⚠️</span>
          </div>
          <div className="mt-3">
            <p className="font-[Arial] text-[22px] font-bold text-[#F39C12] leading-none">
              {lowStockCount}
            </p>
            <p className="mt-1 pl-1 text-[10px] text-[#9CA3AF] uppercase tracking-[0.22em]">
              {outOfStockCount} agotados
            </p>
          </div>
        </article>

        <article className="bt-panel rounded-[22px] p-4 flex flex-col justify-between shadow-[0_12px_30px_rgba(0,0,0,0.22)] min-h-[140px]">
          <div className="flex justify-between items-start gap-3">
            <p className="pl-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]">
              SUCURSALES
            </p>
            <span className="text-sm">🏪</span>
          </div>
          <div className="mt-3">
            <p className="font-[Arial] text-[22px] font-bold text-[#2ECC71] leading-none">
              {storeRatio}
            </p>
            <p className="truncate text-[10px] text-[#9CA3AF] uppercase tracking-[0.22em] mt-1">
              {activeStoreLabel}
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-10 mb-10">
        <article className="bt-panel rounded-[24px] p-5 flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-['Bebas_Neue'] text-[22px] tracking-[0.22em] text-white uppercase">
              📉 Ventas semanales
            </h2>
            <span className="rounded-full bg-[#E8621A] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
              Esta semana
            </span>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-[18px] border border-[#222222] bg-[#0F0F0F]">
            <svg
              viewBox="0 0 560 180"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              {/* Líneas horizontales de guía */}
              {[0, 1, 2, 3].map((line) => {
                const y = 18 + line * 40;
                return (
                  <line
                    key={line}
                    x1="28"
                    y1={y}
                    x2="532"
                    y2={y}
                    stroke="#2A2A2A"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                );
              })}
              <polyline
                fill="none"
                stroke="#E8621A"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={chartPolyline}
              />
              {chartCoordinates.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#FFFFFF"
                  stroke="#E8621A"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
          {/* Eje X */}
          <div className="w-full flex justify-between px-7 pt-2 text-[10px] font-mono text-[#888888]">
            {weeklyChart.map((point, index) => (
              <span
                key={point.label}
                className={index === 6 ? "text-[#E8621A] font-bold" : ""}
              >
                {point.label}
              </span>
            ))}
          </div>
        </article>

        {/* TOP PRODUCTOS */}
        <article className="bt-panel rounded-[24px] p-5 flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-['Bebas_Neue'] text-[22px] tracking-[0.22em] text-white uppercase">
              🏆 Top productos
            </h2>
            <span className="rounded-full bg-[#2ECC71] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B1F0F]">
              Más vendidos
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center rounded-[18px] border border-[#222222] bg-[#111111]">
            <p className="text-sm text-[#D1D5DB] font-sans">
              Sin datos registrados
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-10">
        <article className="bt-panel rounded-[24px] p-5 flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] overflow-hidden min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Bebas_Neue'] text-[18px] tracking-[0.22em] text-white uppercase">
              🕒 Ventas recientes
            </h2>
            <button className="rounded-full border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-semibold transition-colors hover:border-[#6B7280]">
              Ver todas →
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                    FOLIO
                  </th>
                  <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                    SUCURSAL
                  </th>
                  <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                    FECHA
                  </th>
                  <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? (
                  recentSales.slice(0, 3).map(
                    (
                      sale, // Mostramos solo 3 para no desbordar
                    ) => (
                      <tr
                        key={sale.id}
                        className="border-b border-[#222222] last:border-0"
                      >
                        <td className="py-1.5 font-mono text-[11px] text-white">
                          VTA-{sale.id.slice(-4).toUpperCase()}
                        </td>
                        <td className="py-1.5 text-[11px] text-[#CBD5E1] truncate max-w-[100px]">
                          {sale.store.name}
                        </td>
                        <td className="py-1.5 font-mono text-[10px] text-[#888888]">
                          {new Intl.DateTimeFormat("es-MX", {
                            dateStyle: "short",
                          }).format(sale.createdAt)}
                        </td>
                        <td className="py-1.5 text-right font-mono text-[11px] text-[#E8621A]">
                          {formatCurrency(Number(sale.total))}
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-[10px] text-[#888888] font-mono"
                    >
                      Sin transacciones hoy
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="bt-panel rounded-[24px] p-5 flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Bebas_Neue'] text-[18px] tracking-[0.22em] text-white uppercase">
              ⚠️ Alertas de stock
            </h2>
            <button className="rounded-full border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-semibold transition-colors hover:border-[#6B7280]">
              Gestionar →
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center rounded-[18px] border border-[#222222] bg-[#0F0F0F] px-4">
            <label className="flex items-center gap-3 cursor-default">
              <input
                type="checkbox"
                checked={lowStockCount === 0}
                readOnly
                className="h-4 w-4 rounded border-[#333333] bg-[#242424] accent-[#2ECC71] pointer-events-none"
              />
              <span
                className={`text-sm font-semibold ${lowStockCount === 0 ? "text-[#2ECC71]" : "text-[#E8621A]"}`}
              >
                {lowStockCount === 0
                  ? "Todo en orden"
                  : `${lowStockCount} alertas de stock`}
              </span>
            </label>
          </div>
        </article>
      </section>
    </div>
  );
}
