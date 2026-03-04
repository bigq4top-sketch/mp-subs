import { Card, BlockStack, Text, InlineStack } from "@shopify/polaris";

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  date: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const EVENT_ICONS: Record<string, { icon: string; color: string }> = {
  created: { icon: "🆕", color: "#2C6ECB" },
  authorized: { icon: "✅", color: "#22c55e" },
  payment: { icon: "💰", color: "#16a34a" },
  cancelled: { icon: "❌", color: "#ef4444" },
  paused: { icon: "⏸️", color: "#f59e0b" },
  payment_failed: { icon: "⚠️", color: "#ef4444" },
};

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
  if (events.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Actividad reciente</Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Sin actividad todavia
          </Text>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Actividad reciente</Text>
        <BlockStack gap="300">
          {events.map((event) => {
            const config = EVENT_ICONS[event.type] || { icon: "📋", color: "#6b7280" };
            return (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{config.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text as="p" variant="bodySm">
                    {event.description}
                  </Text>
                </div>
                <Text as="span" variant="bodySm" tone="subdued">
                  {timeAgo(event.date)}
                </Text>
              </div>
            );
          })}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
