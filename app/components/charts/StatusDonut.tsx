import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, BlockStack, Text, InlineStack } from "@shopify/polaris";

interface StatusDonutProps {
  data: { name: string; value: number; color: string }[];
}

export function StatusDonut({ data }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Distribucion por estado</Text>
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
        <Text as="h2" variant="headingMd">Distribucion por estado</Text>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data
                    .filter((d) => d.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => {
                    const v = value ?? 0;
                    return [`${v} (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`, name ?? ""];
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <BlockStack gap="200">
            {data
              .filter((d) => d.value > 0)
              .map((item) => (
                <InlineStack key={item.name} gap="200" blockAlign="center">
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Text as="span" variant="bodySm">
                    {item.name}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                  </Text>
                </InlineStack>
              ))}
          </BlockStack>
        </div>
      </BlockStack>
    </Card>
  );
}
