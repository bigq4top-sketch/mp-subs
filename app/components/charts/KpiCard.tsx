import { Card, BlockStack, InlineStack, Text, Icon } from "@shopify/polaris";
import { ArrowUpIcon, ArrowDownIcon } from "@shopify/polaris-icons";

interface KpiCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  currentValue?: number;
  format?: "number" | "currency" | "percent";
  invertTrend?: boolean; // true = lower is better (e.g., churn)
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

export function KpiCard({
  title,
  value,
  previousValue,
  currentValue,
  format = "number",
  invertTrend = false,
}: KpiCardProps) {
  let changePercent: number | null = null;
  let isPositive = true;

  if (previousValue !== undefined && currentValue !== undefined && previousValue > 0) {
    changePercent = ((currentValue - previousValue) / previousValue) * 100;
    isPositive = invertTrend ? changePercent <= 0 : changePercent >= 0;
  }

  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" tone="subdued">
          {title}
        </Text>
        <InlineStack align="space-between" blockAlign="end">
          <Text as="p" variant="headingXl">
            {formatValue(value, format)}
          </Text>
          {changePercent !== null && (
            <InlineStack gap="100" blockAlign="center">
              <div style={{ color: isPositive ? "#22c55e" : "#ef4444" }}>
                <Icon source={changePercent >= 0 ? ArrowUpIcon : ArrowDownIcon} />
              </div>
              <Text
                as="span"
                variant="bodySm"
                tone={isPositive ? "success" : "critical"}
              >
                {Math.abs(changePercent).toFixed(1)}%
              </Text>
            </InlineStack>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
