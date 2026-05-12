import { prisma } from "../../../lib/prisma";
import { formatCurrency } from "../../../lib/utils";
import { cookies } from "next/headers";
import { verifyAuthToken } from "../../../lib/token-utils";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload) {
    return <div>Unauthorized</div>;
  }

  const { role, storeId } = authPayload;

  const whereClause = role === "MANAGER" && storeId ? { storeId } : {};

  const [totalSales, salesCount, lowStockItems, storesCount] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true },
      where: whereClause,
    }),
    prisma.sale.count({ where: whereClause }),
    prisma.inventory.count({
      where: {
        quantity: { lte: 2 },
        ...(role === "MANAGER" && storeId ? { storeId } : {}),
      },
    }),
    role === "ADMIN" ? prisma.store.count() : 1,
  ]);

  const metrics = [
    { 
      name: "Ventas Totales", 
      value: formatCurrency(Number(totalSales._sum.total || 0)), 
      color: "text-[#2ECC71]" 
    },
    { name: "Transacciones", value: salesCount.toString(), color: "text-white" },
    { name: "Stock Bajo (Alerta)", value: lowStockItems.toString(), color: "text-[#E74C3C]" },
    { name: "Sucursales", value: storesCount.toString(), color: "text-[#E8621A]" },
  ];

  return (
    <div className="p-8 bg-bt-dark min-h-screen">
      <header className="mb-10">
        <h1 className="text-4xl font-bebas text-white tracking-widest uppercase">Dashboard Operativo</h1>
        <p className="text-gray-500 font-sans">Resumen general del estado de Ben Tenison.</p>
      </header>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-bt-surface border border-gray-800 p-6 rounded-xl shadow-lg">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-bold">{metric.name}</p>
            <p className={`text-3xl font-mono font-bold ${metric.color}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección de Alerta de Inventario (RF03/RF07) */}
        <div className="bg-bt-surface border border-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bebas text-bt-orange mb-4 uppercase">Alertas de Stock Crítico</h2>
          {lowStockItems > 0 ? (
            <p className="text-bt-error animate-pulse font-bold">
              ⚠️ Tienes {lowStockItems} productos con inventario insuficiente.
            </p>
          ) : (
            <p className="text-green-400 font-bold">
              ✅ Todos los productos tienen stock suficiente.
            </p>
          )}
        </div>

        {/* Sección de Ventas Recientes */}
        <div className="bg-bt-surface border border-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bebas text-bt-orange mb-4 uppercase">Ventas Recientes</h2>
          <p className="text-gray-400">
            Funcionalidad de ventas recientes próximamente.
          </p>
        </div>
      </div>
    </div>
  );
}