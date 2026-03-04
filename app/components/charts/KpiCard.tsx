interface KpiCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  currentValue?: number;
  format?: "number" | "currency" | "percent";
  invertTrend?: boolean;
  accent: "green" | "blue" | "purple" | "amber";
  icon: "revenue" | "users" | "new" | "churn";
  subtitle?: string;
}

function formatValue(value: string | number, format: string): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "currency":
      return `$${value.toLocaleString("es-AR")}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString("es-AR");
  }
}

const ICONS: Record<string, JSX.Element> = {
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  new: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  churn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export function KpiCard({
  title,
  value,
  previousValue,
  currentValue,
  format = "number",
  invertTrend = false,
  accent,
  icon,
  subtitle,
}: KpiCardProps) {
  let changePercent: number | null = null;
  let isPositive = true;

  if (previousValue !== undefined && currentValue !== undefined && previousValue > 0) {
    changePercent = ((currentValue - previousValue) / previousValue) * 100;
    isPositive = invertTrend ? changePercent <= 0 : changePercent >= 0;
  }

  return (
    <div className="kpi-card" data-accent={accent}>
      <div className="kpi-header">
        <span className="kpi-label">{title}</span>
        <div className="kpi-icon" data-accent={accent}>
          {ICONS[icon]}
        </div>
      </div>
      <div className="kpi-value">{formatValue(value, format)}</div>
      <div className="kpi-footer">
        {changePercent !== null && (
          <span className="kpi-trend" data-positive={String(isPositive)}>
            <svg viewBox="0 0 12 12" fill="currentColor">
              {changePercent >= 0 ? (
                <path d="M6 2l4 5H2z" />
              ) : (
                <path d="M6 10l4-5H2z" />
              )}
            </svg>
            {Math.abs(changePercent).toFixed(1)}%
          </span>
        )}
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
