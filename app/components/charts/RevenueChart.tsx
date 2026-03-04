import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  totalRevenue: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      <div className="custom-tooltip-value">${(payload[0].value ?? 0).toLocaleString("es-AR")}</div>
    </div>
  );
}

export function RevenueChart({ data, totalRevenue }: RevenueChartProps) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Ingresos mensuales</div>
          <div className="chart-subtitle">Ultimos 6 meses</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--p-color-text, #111)" }}>
            ${totalRevenue.toLocaleString("es-AR")}
          </div>
          <div className="chart-subtitle">total acumulado</div>
        </div>
      </div>

      {!hasData ? (
        <div className="chart-empty">
          <div className="chart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15l4-4 4 4 4-8 6 8" />
            </svg>
          </div>
          <div className="chart-empty-text">
            Los ingresos se mostraran aqui<br />cuando se procesen pagos
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--p-color-border-subdued, #f0f0f0)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--p-color-text-subdued, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--p-color-text-subdued, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }}
                activeDot={{ fill: "#3b82f6", strokeWidth: 2, stroke: "#fff", r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
