import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PlanDistributionProps {
  data: { name: string; count: number }[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899"];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{payload[0].payload.name}</div>
      <div className="custom-tooltip-value">{payload[0].value} suscripciones</div>
    </div>
  );
}

export function PlanDistribution({ data }: PlanDistributionProps) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Suscripciones por plan</div>
          <div className="chart-subtitle">Solo planes activos</div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="chart-empty">
          <div className="chart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <div className="chart-empty-text">
            Sin suscripciones activas por plan
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: Math.max(200, data.length * 52) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barCategoryGap="28%">
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "var(--p-color-text-subdued, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 13, fill: "var(--p-color-text, #111)", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--p-color-bg-surface-secondary, #f9fafb)", radius: 4 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
