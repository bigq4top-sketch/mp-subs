import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, Link } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  Text,
  IndexTable,
  Badge,
  InlineStack,
  Button,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const bundles = await db.bundle.findMany({
    where: { shop },
    include: {
      tiers: { orderBy: { position: "asc" } },
      stats: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const bundlesData = bundles.map((b) => {
    const totalVisitors = b.stats.reduce((s, st) => s + st.visitors, 0);
    const totalConversions = b.stats.reduce((s, st) => s + st.conversions, 0);
    const totalRevenue = b.stats.reduce((s, st) => s + st.revenue, 0);
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
    const aov = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    return {
      id: b.id,
      name: b.name,
      title: b.title,
      type: b.type,
      active: b.active,
      tiersCount: b.tiers.length,
      visitors: totalVisitors,
      conversionRate: Math.round(conversionRate * 10) / 10,
      aov: Math.round(aov * 100) / 100,
      revenue: Math.round(totalRevenue * 100) / 100,
      createdAt: b.createdAt,
    };
  });

  return json({ bundles: bundlesData });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "toggle") {
    const bundleId = formData.get("bundleId") as string;
    const bundle = await db.bundle.findUnique({ where: { id: bundleId } });
    if (bundle && bundle.shop === session.shop) {
      await db.bundle.update({
        where: { id: bundleId },
        data: { active: !bundle.active },
      });
    }
    return json({ success: true });
  }

  if (intent === "delete") {
    const bundleId = formData.get("bundleId") as string;
    const bundle = await db.bundle.findUnique({ where: { id: bundleId } });
    if (bundle && bundle.shop === session.shop) {
      await db.bundle.delete({ where: { id: bundleId } });
    }
    return json({ success: true });
  }

  return json({ error: "Intent no reconocido" }, { status: 400 });
};

const typeLabels: Record<string, string> = {
  quantity_break: "Quantity Break",
  multi_product: "Multi-producto",
  bxgy: "Compra X Lleva Y",
};

export default function BundlesPage() {
  const { bundles } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleToggle = (bundleId: string) => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("bundleId", bundleId);
    submit(formData, { method: "POST" });
  };

  const handleDelete = (bundleId: string) => {
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("bundleId", bundleId);
    submit(formData, { method: "POST" });
  };

  return (
    <Page>
      <TitleBar title="Packs y Bundles">
        <Link to="/app/bundles/new">
          <button variant="primary">Crear pack</button>
        </Link>
      </TitleBar>
      <BlockStack gap="500">
        <Card>
          {bundles.length === 0 ? (
            <EmptyState
              heading="Crea tu primer pack"
              image=""
            >
              <p>
                Los packs permiten ofrecer descuentos por cantidad. Tus clientes compran mas
                y vos ganás mas.
              </p>
              <Link to="/app/bundles/new">
                <Button variant="primary">Crear mi primer pack</Button>
              </Link>
            </EmptyState>
          ) : (
            <IndexTable
              itemCount={bundles.length}
              headings={[
                { title: "Nombre" },
                { title: "Tipo" },
                { title: "Tiers" },
                { title: "Visitantes" },
                { title: "TC%" },
                { title: "AOV" },
                { title: "Revenue" },
                { title: "Estado" },
                { title: "Acciones" },
              ]}
              selectable={false}
            >
              {bundles.map((bundle, index) => (
                <IndexTable.Row id={bundle.id} key={bundle.id} position={index}>
                  <IndexTable.Cell>
                    <Link to={`/app/bundles/${bundle.id}`}>
                      <Text variant="bodyMd" fontWeight="bold" as="span">
                        {bundle.name}
                      </Text>
                    </Link>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge>{typeLabels[bundle.type] || bundle.type}</Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{bundle.tiersCount}</IndexTable.Cell>
                  <IndexTable.Cell>{bundle.visitors.toLocaleString()}</IndexTable.Cell>
                  <IndexTable.Cell>{bundle.conversionRate}%</IndexTable.Cell>
                  <IndexTable.Cell>${bundle.aov.toLocaleString()}</IndexTable.Cell>
                  <IndexTable.Cell>${bundle.revenue.toLocaleString()}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone={bundle.active ? "success" : undefined}>
                      {bundle.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <InlineStack gap="200">
                      <Button size="slim" onClick={() => handleToggle(bundle.id)}>
                        {bundle.active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button size="slim" tone="critical" onClick={() => handleDelete(bundle.id)}>
                        Eliminar
                      </Button>
                    </InlineStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}
