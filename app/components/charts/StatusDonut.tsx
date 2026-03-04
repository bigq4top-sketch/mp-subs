import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface StatusDonutProps {
  data: { name: string; value: number; color: string }[];
}

export function StatusDonut({ data }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const filtered = data.filter((d) => d.value > 0);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Distribucion por estado</div>
          <div className="chart-subtitle">{total} suscripciones totales</div>
        </div>
      </div>

      {total === 0 ? (
        <div className="chart-empty">
          <div className="chart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 12l4-4" />
            </svg>
          </div>
          <div className="chart-empty-text">Sin suscripciones todavia</div>
        </div>
      ) : (
        <div className="donut-wrapper">
          <div className="donut-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filtered}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={filtered.length > 1 ? 3 : 0}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {filtered.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <div className="donut-center-value">{total}</div>
              <div className="donut-center-label">total</div>
            </div>
          </div>

          <div className="status-legend">
            {data.map((item) => (
              <div key={item.name} className="status-legend-item">
                <div className="status-legend-dot" style={{ backgroundColor: item.color }} />
                <span className="status-legend-label">{item.name}</span>
                <span className="status-legend-value">{item.value}</span>
                <span className="status-legend-pct">
                  {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
