import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, BlockStack, Text } from "@shopify/polaris";

interface PlanDistributionProps {
  data: { name: string; count: number }[];
}

const COLORS = ["#2C6ECB", "#5BA5F9", "#8FBBEA", "#B4D5FF", "#D4E6F9"];

export function PlanDistribution({ data }: PlanDistributionProps) {
  if (data.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Suscripciones por plan</Text>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <Text as="p" variant="bodyMd" tone="subdued">Sin datos</Text>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Suscripciones por plan</Text>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                formatter={(value: number | undefined) => [value ?? 0, "Suscripciones"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </BlockStack>
    </Card>
  );
}
