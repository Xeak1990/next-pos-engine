import { prisma } from "../../../lib/prisma";
import { formatCurrency } from "../../../lib/utils";

export default async function DashboardPage() {
  // RF10: Consultas para métricas en tiempo real [cite: 90, 214]
  const [totalSales, salesCount, lowStockItems, storesCount] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true } }), // Total vendido
    prisma.sale.count(), // Número de transacciones
    prisma.inventory.count({ where: { quantity: { lte: 2 } } }), // Alerta stock bajo (<= 2)
    prisma.store.count(), // Sucursales registradas
  ]);

const metrics = [
  { 
    name: "Ventas Totales", 
    // Convertimos el valor a Number para evitar el error de asignación
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
        <p className="text-gray-500 font-sans">Resumen general del estado de Ben Tenison[cite: 248].</p>
      </header>

      {/* Tarjetas de Métricas (KPIs) [cite: 256, 372] */}
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
        {/* Sección de Alerta de Inventario (RF03/RF07) [cite: 228, 256] */}
        <div className="bg-bt-surface border border-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bebas text-bt-orange mb-4 uppercase">Alertas de Stock Crítico</h2>
          {lowStockItems > 0 ? (
            <p className="text-bt-error animate-pulse font-bold">
              ⚠️ Tienes {lowStockItems} productos con inventario insuficiente.
            </p>
          ) : (
            <p className="text-bt-success font-bold">✅ Todo el inventario está en niveles óptimos.</p>
          )}
        </div>

        {/* Acceso rápido a módulos (Sitemap) [cite: 71, 430] */}
        <div className="bg-bt-surface border border-gray-800 p-6 rounded-xl flex items-center justify-center gap-4">
           <a href="/terminal" className="flex-1 text-center py-4 bg-bt-navy rounded-lg font-bebas text-xl hover:bg-bt-orange transition-all">
             Abrir POS [cite: 256]
           </a>
           <a href="/inventory" className="flex-1 text-center py-4 border border-gray-700 rounded-lg font-bebas text-xl hover:bg-gray-800 transition-all">
             Gestionar Stock [cite: 400]
           </a>
        </div>
      </div>
    </div>
  );
}