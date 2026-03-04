import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  Text,
  InlineGrid,
  Banner,
  IndexTable,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { KpiCard } from "../components/charts/KpiCard";
import { RevenueChart } from "../components/charts/RevenueChart";
import { PlanDistribution } from "../components/charts/PlanDistribution";
import { StatusDonut } from "../components/charts/StatusDonut";
import { ActivityFeed } from "../components/charts/ActivityFeed";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    settings,
    allSubscriptions,
    recentSubs,
    recentEvents,
    paymentEvents,
    newThisMonth,
    newLastMonth,
    cancelledThisMonth,
  ] = await Promise.all([
    db.settings.findUnique({ where: { shop } }),

    db.subscription.findMany({
      where: { shop },
      include: { plan: true },
    }),

    db.subscription.findMany({
      where: { shop },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    db.subscriptionEvent.findMany({
      where: { shop },
      include: { subscription: { select: { payerEmail: true, plan: { select: { name: true, amount: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    db.subscriptionEvent.findMany({
      where: { shop, type: "payment" },
      select: { amount: true, createdAt: true },
    }),

    db.subscription.count({
      where: { shop, createdAt: { gte: firstDayThisMonth } },
    }),

    db.subscription.count({
      where: {
        shop,
        createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
    }),

    db.subscriptionEvent.count({
      where: { shop, type: "cancelled", createdAt: { gte: firstDayThisMonth } },
    }),
  ]);

  const isConfigured = !!settings?.mpAccessToken;

  // KPI: MRR = sum of plan amounts for authorized subs
  const activeSubs = allSubscriptions.filter((s) => s.status === "authorized");
  const mrr = activeSubs.reduce((sum, s) => sum + s.plan.amount, 0);

  // MRR del mes anterior (estimado: activas al inicio del mes * precio promedio)
  const subsAtStartOfMonth = allSubscriptions.filter(
    (s) => s.createdAt < firstDayThisMonth && s.status === "authorized",
  );
  const previousMrr = subsAtStartOfMonth.reduce((sum, s) => sum + s.plan.amount, 0);

  // Churn rate = cancelled this month / active at start of month
  const activeAtStartOfMonth = allSubscriptions.filter(
    (s) =>
      s.createdAt < firstDayThisMonth &&
      (s.status === "authorized" || s.status === "cancelled"),
  ).length;
  const churnRate =
    activeAtStartOfMonth > 0
      ? (cancelledThisMonth / activeAtStartOfMonth) * 100
      : 0;

  // Revenue total
  const totalRevenue = paymentEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Revenue por mes (últimos 6 meses)
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthRevenue = paymentEvents
      .filter((e) => e.createdAt >= d && e.createdAt < nextD)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const monthLabel = d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    revenueByMonth.push({ month: monthLabel, revenue: monthRevenue });
  }

  // Subs por plan
  const planCounts: Record<string, { name: string; count: number }> = {};
  for (const sub of activeSubs) {
    const key = sub.planId;
    if (!planCounts[key]) {
      planCounts[key] = { name: sub.plan.name, count: 0 };
    }
    planCounts[key].count++;
  }
  const subsByPlan = Object.values(planCounts).sort((a, b) => b.count - a.count);

  // Subs por estado
  const statusCounts: Record<string, number> = {};
  for (const sub of allSubscriptions) {
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
  }
  const subsByStatus = [
    { name: "Activas", value: statusCounts["authorized"] || 0, color: "#22c55e" },
    { name: "Pendientes", value: statusCounts["pending"] || 0, color: "#f59e0b" },
    { name: "Canceladas", value: statusCounts["cancelled"] || 0, color: "#ef4444" },
    { name: "Pausadas", value: statusCounts["paused"] || 0, color: "#3b82f6" },
  ];

  // Top ciudades
  const cityCounts: Record<string, number> = {};
  for (const sub of activeSubs) {
    const city = sub.shippingCity || "Sin ciudad";
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  }
  const topCities = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCityCount = topCities[0]?.count || 1;

  // Activity feed
  const activityFeed = recentEvents.map((evt) => {
    let description = "";
    const email = evt.subscription?.payerEmail || "desconocido";
    const planName = evt.subscription?.plan?.name || "";
    const amount = evt.subscription?.plan?.amount || 0;

    switch (evt.type) {
      case "created":
        description = `Nueva suscripcion de ${email}`;
        break;
      case "authorized":
        description = `Suscripcion autorizada — ${email}`;
        break;
      case "payment":
        description = `Pago recibido — ${planName} — $${amount.toLocaleString("es-AR")}`;
        break;
      case "cancelled":
        description = `Suscripcion cancelada — ${email}`;
        break;
      case "paused":
        description = `Suscripcion pausada — ${email}`;
        break;
      case "payment_failed":
        description = `Pago fallido — ${email}`;
        break;
      default:
        description = `${evt.type} — ${email}`;
    }

    return {
      id: evt.id,
      type: evt.type,
      description,
      date: evt.createdAt.toISOString(),
    };
  });

  return json({
    isConfigured,
    mrr,
    previousMrr,
    activeSubsCount: activeSubs.length,
    previousActiveCount: subsAtStartOfMonth.length,
    newThisMonth,
    newLastMonth,
    churnRate,
    totalRevenue,
    revenueByMonth,
    subsByPlan,
    subsByStatus,
    topCities,
    maxCityCount,
    activityFeed,
    recentSubs: recentSubs.map((s) => ({
      id: s.id,
      payerEmail: s.payerEmail,
      payerName: s.payerName,
      shippingCity: s.shippingCity,
      planName: s.plan.name,
      amount: s.plan.amount,
      currency: s.plan.currency,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { tone: "success" | "attention" | "critical" | "info"; label: string }> = {
    authorized: { tone: "success", label: "Activa" },
    pending: { tone: "attention", label: "Pendiente" },
    cancelled: { tone: "critical", label: "Cancelada" },
    paused: { tone: "info", label: "Pausada" },
  };
  const c = config[status] || { tone: "info" as const, label: status };
  return <Badge tone={c.tone}>{c.label}</Badge>;
}

export default function Dashboard() {
  const {
    isConfigured,
    mrr,
    previousMrr,
    activeSubsCount,
    previousActiveCount,
    newThisMonth,
    newLastMonth,
    churnRate,
    revenueByMonth,
    subsByPlan,
    subsByStatus,
    topCities,
    maxCityCount,
    activityFeed,
    recentSubs,
  } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="MP Suscripciones" />
      <BlockStack gap="500">
        {!isConfigured && (
          <Banner tone="warning" action={{ content: "Ir a Settings", url: "/app/settings" }}>
            <p>
              MercadoPago no esta configurado. Ingresa tus credenciales para
              empezar a recibir suscripciones.
            </p>
          </Banner>
        )}

        {/* Sección 1: KPI Cards */}
        <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
          <KpiCard
            title="MRR"
            value={mrr}
            format="currency"
            currentValue={mrr}
            previousValue={previousMrr}
          />
          <KpiCard
            title="Suscripciones activas"
            value={activeSubsCount}
            currentValue={activeSubsCount}
            previousValue={previousActiveCount}
          />
          <KpiCard
            title="Nuevas este mes"
            value={newThisMonth}
            currentValue={newThisMonth}
            previousValue={newLastMonth}
          />
          <KpiCard
            title="Tasa de cancelacion"
            value={churnRate}
            format="percent"
            invertTrend
          />
        </InlineGrid>

        {/* Sección 2: Gráfico de revenue */}
        <RevenueChart data={revenueByMonth} />

        {/* Sección 3: Charts secundarios */}
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <PlanDistribution data={subsByPlan} />
          <StatusDonut data={subsByStatus} />
        </InlineGrid>

        {/* Sección 4: Ciudades + Actividad */}
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          {/* Top ciudades */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Top ciudades</Text>
              {topCities.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">Sin datos de ubicacion</Text>
              ) : (
                <BlockStack gap="300">
                  {topCities.map((c) => (
                    <div key={c.city}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text as="span" variant="bodySm">{c.city}</Text>
                        <Text as="span" variant="bodySm" tone="subdued">{c.count}</Text>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#e5e7eb",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(c.count / maxCityCount) * 100}%`,
                            backgroundColor: "#2C6ECB",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>

          {/* Actividad reciente */}
          <ActivityFeed events={activityFeed} />
        </InlineGrid>

        {/* Sección 5: Tabla de suscripciones recientes */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Suscripciones recientes</Text>
              {recentSubs.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No hay suscripciones todavia.
                </Text>
              ) : (
                <IndexTable
                  itemCount={recentSubs.length}
                  headings={[
                    { title: "Cliente" },
                    { title: "Plan" },
                    { title: "Monto" },
                    { title: "Ciudad" },
                    { title: "Estado" },
                    { title: "Fecha" },
                  ]}
                  selectable={false}
                >
                  {recentSubs.map((sub, index) => (
                    <IndexTable.Row id={sub.id} key={sub.id} position={index}>
                      <IndexTable.Cell>
                        <BlockStack gap="100">
                          <Text variant="bodyMd" fontWeight="bold" as="span">
                            {sub.payerName || sub.payerEmail}
                          </Text>
                          {sub.payerName && (
                            <Text variant="bodySm" tone="subdued" as="span">
                              {sub.payerEmail}
                            </Text>
                          )}
                        </BlockStack>
                      </IndexTable.Cell>
                      <IndexTable.Cell>{sub.planName}</IndexTable.Cell>
                      <IndexTable.Cell>
                        ${sub.amount.toLocaleString()} {sub.currency}
                      </IndexTable.Cell>
                      <IndexTable.Cell>{sub.shippingCity || "-"}</IndexTable.Cell>
                      <IndexTable.Cell>
                        <StatusBadge status={sub.status} />
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {new Date(sub.createdAt).toLocaleDateString("es-AR")}
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
