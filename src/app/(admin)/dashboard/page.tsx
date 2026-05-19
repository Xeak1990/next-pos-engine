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
    <div className="flex-1 min-h-screen max-w-full bg-[#060606] px-6 py-8 text-white overflow-hidden">
      {/* Ajustamos el contenedor de la cabecera para que sea un row y use justify-between */}
      {/* Después: Quitamos mx-auto y max-w, usamos w-full */}
      <div className="flex w-full items-start justify-between mb-[15px]">
        {/* GRUPO IZQUIERDO: Migas, Título y Fecha */}
        <div className="flex flex-col">
          {/* NUEVO: Migas de Pan (Breadcrumbs) */}
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link
              href="/"
              className="hover:text-white transition-colors duration-200"
            >
              Principal
            </Link>
            <span>/</span>
            {/* Resaltamos la página actual con tu color naranja */}
            <span className="text-[#e8621a]">Dashboard</span>
          </nav>

          {/* TÍTULO LIMPIO */}
          <h1
            className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
            style={{
              fontFamily: "Arial, sans-serif",
              // Mantenemos solo el transform que estira la letra y el borde blanco
              transform: "scale(0.85, 1.15)",
              transformOrigin: "left center",
              WebkitTextStroke: "1.5px white",
            }}
          >
            Dashboard
          </h1>

          {/* FECHA */}
          <p className="mt-3 text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {formatLowercaseDate(now)}
          </p>
        </div>

        {/* GRUPO DERECHO: Botones (Se queda igual) */}
        <div className="flex items-center gap-3 mt-1">
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

      {/* 1. SEPARACIÓN EXTERIOR ENTRE TARJETAS */}
      <section className="grid grid-cols-4 gap-[15px] mb-8">
        {/* VENTAS HOY (sin cambios estructurales, solo se mantiene) */}
        <article
          className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
          style={{
            height: "125px",
            minHeight: "unset",
            padding: "0",
          }}
        >
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              VENTAS HOY
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p
              className="text-[26px] font-[900] text-[#e8621a] uppercase flex items-center h-full"
              style={{
                fontFamily: "Arial, sans-serif",
                letterSpacing: "-0.04em",
                transform: "scaleY(1.35) translateY(15px)",
                transformOrigin: "center center",
                WebkitTextStroke: "1.4px #e8621a",
                textShadow: "0 0 1px #e8621a",
              }}
            >
              {formatCurrency(salesTodayValue)}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              {formatVsYesterday(salesTodayValue, salesYesterdayValue)}
            </p>
          </div>
        </article>

        {/* TRANSACCIONES - Misma forma que VENTAS HOY */}
        <article
          className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
          style={{ height: "125px", minHeight: "unset", padding: "0" }}
        >
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              TRANSACCIONES
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p
              className="text-[26px] font-[900] text-white uppercase flex items-center h-full"
              style={{
                fontFamily: "Arial, sans-serif",
                letterSpacing: "-0.04em",
                transform: "scaleY(1.35) translateY(15px)",
                transformOrigin: "center center",
              }}
            >
              {transactionsToday}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              Hoy
            </p>
          </div>
        </article>

        {/* STOCK BAJO - Misma forma */}
        <article
          className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
          style={{ height: "125px", minHeight: "unset", padding: "0" }}
        >
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              STOCK BAJO
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p
              className="text-[26px] font-[900] text-[#F39C12] uppercase flex items-center h-full"
              style={{
                fontFamily: "Arial, sans-serif",
                letterSpacing: "-0.04em",
                transform: "scaleY(1.35) translateY(15px)",
                transformOrigin: "center center",
              }}
            >
              {lowStockCount}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              {outOfStockCount} agotados
            </p>
          </div>
        </article>

        {/* SUCURSALES - Misma forma */}
        <article
          className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
          style={{ height: "125px", minHeight: "unset", padding: "0" }}
        >
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              SUCURSALES
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p
              className="text-[26px] font-[900] text-[#2ECC71] uppercase flex items-center h-full"
              style={{
                fontFamily: "Arial, sans-serif",
                letterSpacing: "-0.04em",
                transform: "scaleY(1.35) translateY(15px)",
                transformOrigin: "center center",
              }}
            >
              {storeRatio}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="truncate text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
              {activeStoreLabel}
            </p>
          </div>
        </article>
      </section>

      {/* SECCIÓN TARJETAS PEQUEÑAS (sin cambios, solo ajuste de margen inferior a 10px) */}
      <section className="grid grid-cols-4 gap-[15px] mb-[10px]">
        {/* ... contenido de VENTAS HOY, TRANSACCIONES, STOCK BAJO, SUCURSALES (igual que antes) ... */}
      </section>

      {/* PRIMERA FILA DE TARJETAS GRANDES */}
      <section className="grid grid-cols-2 gap-[15px] mb-[15px]">
        {/* VENTAS SEMANALES */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2
                className="text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                📉 Ventas semanales
              </h2>
              <span
                style={{
                  display: "inline-block",
                  borderRadius: "9999px",
                  backgroundColor: "#2C2418", // gris oscuro con tono naranja (difuminado/tierra)
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#C2410C", // naranja intenso (el que iba en el fondo)
                  lineHeight: "1",
                  boxShadow:
                    "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                Esta semana
              </span>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <svg
                viewBox="0 0 560 180"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
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
          </div>
        </article>

        {/* TOP PRODUCTOS */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2
                className="text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                🏆 Top productos
              </h2>
              <span
                style={{
                  display: "inline-block",
                  borderRadius: "9999px",
                  backgroundColor: "#1E2A1C", // gris oscuro con tono verde (difuminado/tierra verde)
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#2ECC71", // verde intenso (el clásico éxito)
                  lineHeight: "1",
                  boxShadow:
                    "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                Más vendidos
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] font-semibold text-[#9CA3AF] font-sans">
                Sin datos registrados
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* SEGUNDA FILA DE TARJETAS GRANDES */}
      <section className="grid grid-cols-2 gap-[15px]">
        {/* VENTAS RECIENTES */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] overflow-hidden min-h-[260px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                🕒 Ventas recientes
              </h2>
              <button className="rounded-md border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-semibold transition-colors hover:border-[#6B7280] hover:text-white">
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
                    recentSales.slice(0, 3).map((sale) => (
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
                    ))
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
          </div>
        </article>

        {/* ALERTAS DE STOCK */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[260px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                ⚠️ Alertas de stock
              </h2>
              <button className="rounded-md border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-semibold transition-colors hover:border-[#6B7280] hover:text-white">
                Gestionar →
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <label className="flex items-center gap-3 cursor-default">
                <input
                  type="checkbox"
                  checked={lowStockCount === 0}
                  readOnly
                  className="h-4 w-4 rounded border-[#333333] bg-[#242424] accent-[#2ECC71] pointer-events-none"
                />
                <span
                  className={`text-[13px] font-semibold ${lowStockCount === 0 ? "text-[#2ECC71]" : "text-[#E8621A]"}`}
                >
                  {lowStockCount === 0
                    ? "Todo en orden"
                    : `${lowStockCount} alertas de stock`}
                </span>
              </label>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
