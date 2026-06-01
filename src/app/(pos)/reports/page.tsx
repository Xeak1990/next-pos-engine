// app/(admin)/reports/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { formatCurrency } from "../../../lib/utils";

export const revalidate = 3600;

type DateRangeKey = "today" | "week" | "month" | "last30" | "last60";

// --------------------------------------------------------------
// Funciones de zona horaria México
// --------------------------------------------------------------
function getMexicoOffsetForUTCDate(utcDate: Date): number {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    hour12: false,
  });
  const hourInMexico = parseInt(formatter.format(utcDate), 10);
  const utcHour = utcDate.getUTCHours();
  return hourInMexico - utcHour;
}

function getCurrentMexicoComponents(): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(new Date()).split("-").map(Number);
  return { year, month, day };
}

function getUTCRangeForMexicoDateComponents(year: number, month: number, day: number) {
  const noonUTC = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const offsetHours = getMexicoOffsetForUTCDate(noonUTC);
  const startUTC = new Date(Date.UTC(year, month, day, -offsetHours, 0, 0));
  const endUTC = new Date(Date.UTC(year, month, day, -offsetHours + 24, 0, 0));
  endUTC.setUTCMilliseconds(-1);
  return { startUTC, endUTC };
}

function getDateRangeUTC(option: DateRangeKey) {
  const { year, month, day } = getCurrentMexicoComponents();
  let startYear = year;
  let startMonth = month;
  let startDay = day;
  const endYear = year;
  const endMonth = month;
  let endDay = day;

  if (option === "today") {
    // mismo día
  } else if (option === "week") {
    const startDate = new Date(Date.UTC(year, month - 1, day - 6));
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [y, m, d] = formatter.format(startDate).split("-").map(Number);
    startYear = y;
    startMonth = m;
    startDay = d;
  } else if (option === "month") {
    startDay = 1;
    endDay = new Date(year, month, 0).getDate(); // último día del mes
  } else if (option === "last30") {
    const startDate = new Date(Date.UTC(year, month - 1, day - 29));
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [y, m, d] = formatter.format(startDate).split("-").map(Number);
    startYear = y;
    startMonth = m;
    startDay = d;
  } else if (option === "last60") {
    const startDate = new Date(Date.UTC(year, month - 1, day - 59));
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [y, m, d] = formatter.format(startDate).split("-").map(Number);
    startYear = y;
    startMonth = m;
    startDay = d;
  }

  const { startUTC } = getUTCRangeForMexicoDateComponents(startYear, startMonth - 1, startDay);
  const { endUTC } = getUTCRangeForMexicoDateComponents(endYear, endMonth - 1, endDay);

  console.log(`[Reports] getDateRangeUTC(${option}) -> startUTC: ${startUTC.toISOString()}, endUTC: ${endUTC.toISOString()}`);
  console.log(`[Reports] México: start día ${startDay}/${startMonth}/${startYear}, end día ${endDay}/${endMonth}/${endYear}`);

  return { startUTC, endUTC };
}

function formatQueryDateMexico(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

const rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Últimos 7 días" },
  { key: "month", label: "Este mes" },
  { key: "last30", label: "Últimos 30 días" },
  { key: "last60", label: "Últimos 60 días" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "last30" } = await searchParams;
  const selectedRange = range as DateRangeKey;

  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;
  if (!authPayload || (authPayload.role !== "ADMIN" && authPayload.role !== "MANAGER")) {
    return <div className="p-8 text-white">Acceso denegado</div>;
  }

  const { startUTC, endUTC } = getDateRangeUTC(selectedRange);
  const dateFilter = { createdAt: { gte: startUTC, lte: endUTC } };

  console.log(`[Reports] Rango seleccionado: ${selectedRange}`);
  console.log(`[Reports] Filtro where: createdAt entre ${startUTC.toISOString()} y ${endUTC.toISOString()}`);

  // Totales
  const totalAgg = await prisma.sale.aggregate({
    where: dateFilter,
    _sum: { total: true },
    _count: true,
  });
  const totalSales = Number(totalAgg._sum.total || 0);
  const totalTransactions = totalAgg._count;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Ventas por sucursal
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

  // Top productos
  const topVariants = await prisma.saleItem.groupBy({
    by: ["variantId"],
    where: { sale: dateFilter },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });
  const topSellers: { modelName: string; size: string; quantity: number; total: number }[] = [];
  if (topVariants.length > 0) {
    const variantIds = topVariants.map(v => v.variantId);
    const variantsWithProducts = await prisma.variant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, size: true, price: true, product: { select: { name: true } } },
    });
    const variantMap = new Map(variantsWithProducts.map(v => [v.id, v]));
    for (const item of topVariants) {
      const variant = variantMap.get(item.variantId);
      if (variant) {
        const qty = item._sum.quantity || 0;
        const total = Number(variant.price) * qty;
        topSellers.push({
          modelName: variant.product.name,
          size: variant.size,
          quantity: qty,
          total,
        });
      }
    }
  }

  // Tendencia diaria
  const allSales = await prisma.sale.findMany({
    where: dateFilter,
    select: { total: true, createdAt: true },
  });
  const trendMap = new Map<string, number>();
  for (const sale of allSales) {
    const dateKey = formatQueryDateMexico(sale.createdAt);
    trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + Number(sale.total));
  }

  const salesTrend: { date: string; total: number }[] = [];
  const currentDate = new Date(startUTC);
  const endDate = new Date(endUTC);
  while (currentDate <= endDate) {
    const key = formatQueryDateMexico(currentDate);
    salesTrend.push({ date: key, total: trendMap.get(key) || 0 });
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  const filteredSalesTrend = salesTrend.filter(point => point.total > 0);
  const maxDailySales = filteredSalesTrend.length > 0
    ? Math.max(...filteredSalesTrend.map(p => p.total), 1)
    : 1;

  const hasSales = totalTransactions > 0;
  const nowMexico = new Date();

  return (
    <div className="flex-1 min-h-screen max-w-full bg-[#060606] px-6 py-8 text-white overflow-hidden m-[5px]">
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link href="/users" className="hover:text-white transition-colors duration-200">Administracion</Link>
            <span>/</span>
            <span className="text-[#e8621a]">Reportes</span>
          </nav>
          <h1 className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
            style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.85, 1.15)", transformOrigin: "left center", WebkitTextStroke: "1.5px white" }}>
            Reportes
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {new Intl.DateTimeFormat("es-MX", {
              timeZone: "America/Mexico_City",
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(nowMexico).toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-[5px] mt-1">{/* botones extra */}</div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-[5px] mt-4 mb-[5px] ml-[5px]">
        {rangeOptions.map(option => (
          <Link
            key={option.key}
            href={`/reports?range=${option.key}`}
            className={selectedRange === option.key
              ? "bt-button-primary !rounded-[12px] px-4 py-2 text-xs"
              : "bt-button-ghost !rounded-[12px] px-4 py-2 text-xs"}
            style={{ fontFamily: "Arial, sans-serif", borderRadius: "12px" }}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* Tarjetas KPI */}
      <section className="grid grid-cols-3 gap-[7px] mb-[5px]">
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", minHeight: "unset", padding: "0", borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">Total Ventas</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#2ECC71] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", transformOrigin: "center center" }}>
              {formatCurrency(totalSales)}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">Período seleccionado</p>
          </div>
        </article>

        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", minHeight: "unset", padding: "0", borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">Transacciones</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#E8621A] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", transformOrigin: "center center" }}>
              {totalTransactions}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">Período seleccionado</p>
          </div>
        </article>

        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", minHeight: "unset", padding: "0", borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">Ticket Promedio</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-white uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", transformOrigin: "center center" }}>
              {formatCurrency(averageTicket)}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">Período seleccionado</p>
          </div>
        </article>
      </section>

      {/* Ventas por sucursal */}
      <section className="mb-[5px]">
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4" style={{ borderRadius: "12px !important" }}>
          <div className="w-[94%] mx-auto flex flex-col h-full">
            <h2 className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
              Ventas por sucursal
            </h2>
            <div className="overflow-x-auto">
              {hasSales && salesByStore.length > 0 ? (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Sucursal</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Ventas</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Transacciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByStore.map((store, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white">{store.store}</td>
                        <td className="py-2 text-right font-mono text-[12px] text-[#2ECC71]">{formatCurrency(store.sales)}</td>
                        <td className="py-2 text-right font-mono text-[12px] text-[#E8621A]">{store.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-[#9CA3AF]">No hay ventas en este período</div>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* Tendencia y Top productos */}
      <section className="grid grid-cols-2 gap-[6px] mb-[5px]">
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4" style={{ borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <h2 className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
              Tendencia - Ventas diarias
            </h2>
            {filteredSalesTrend.length > 0 ? (
              <div className="space-y-3">
                {filteredSalesTrend.map((point) => (
                  <div key={point.date}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-[#CBD5E1]">{point.date}</span>
                      <span className="font-mono text-[11px] text-white">{formatCurrency(point.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1F1F1F]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#E8621A] to-[#F59E0B]" style={{ width: `${Math.round((point.total / maxDailySales) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#9CA3AF]">No hay ventas en este período</div>
            )}
          </div>
        </article>

        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4" style={{ borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <h2 className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
              Top productos más vendidos
            </h2>
            <div className="overflow-x-auto">
              {hasSales && topSellers.length > 0 ? (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Modelo</th>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Talla</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Cant.</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white">{item.modelName}</td>
                        <td className="py-2 text-left font-mono text-[11px] text-[#CBD5E1]">{item.size}</td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#E8621A]">{item.quantity}</td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#2ECC71]">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-[#9CA3AF]">No hay productos vendidos en este período</div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}