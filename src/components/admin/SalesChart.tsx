import { formatCurrency } from "../../lib/utils";

interface SalesChartProps {
  points: Array<{
    label: string;
    value: number;
  }>;
}

export default function SalesChart({ points }: SalesChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="rounded-[12px] border border-[#333333] bg-[#111111] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">Dashboard</p>
          <h3 className="mt-2 text-3xl text-white">Ventas Semanales</h3>
        </div>
        <span className="rounded-full border border-[#1A3A5F] bg-[#1A3A5F]/18 px-3 py-2 font-mono text-xs text-[#D7E6F5]">
          7 dias
        </span>
      </div>

      <div className="mt-8 grid h-64 grid-cols-7 items-end gap-3">
        {points.map((point) => {
          const height = `${Math.max((point.value / maxValue) * 100, 12)}%`;

          return (
            <div key={point.label} className="flex h-full flex-col justify-end">
              <div className="group relative flex h-full items-end">
                <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-[8px] border border-[#333333] bg-[#0F0F0F] px-2 py-1 font-mono text-[10px] text-white group-hover:block">
                  {formatCurrency(point.value)}
                </div>
                <div
                  className="w-full rounded-t-[10px] bg-gradient-to-t from-[#E8621A] via-[#F08A4B] to-[#F8B05C] shadow-[0_0_24px_rgba(232,98,26,0.18)]"
                  style={{ height }}
                />
              </div>
              <div className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
