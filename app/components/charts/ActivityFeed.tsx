interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  date: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 30) return `hace ${diffDays}d`;
  return date.toLocaleDateString("es-AR");
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Actividad reciente</div>
          <div className="chart-subtitle">Ultimos eventos</div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="chart-empty">
          <div className="chart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="chart-empty-text">Sin actividad todavia</div>
        </div>
      ) : (
        <div>
          {events.map((event) => (
            <div key={event.id} className="activity-item">
              <div className="activity-dot" data-type={event.type} />
              <div className="activity-content">
                <div className="activity-text">{event.description}</div>
              </div>
              <span className="activity-time">{timeAgo(event.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
