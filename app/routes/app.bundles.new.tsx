import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  Text,
  Select,
  Checkbox,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

interface Tier {
  name: string;
  quantity: string;
  price: string;
  compareAtPrice: string;
  discountPercent: string;
  isPopular: boolean;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = formData.get("data") as string;

  if (!data) {
    return json({ error: "Datos invalidos" }, { status: 400 });
  }

  let parsed: {
    name: string;
    title: string;
    type: string;
    tiers: Array<{
      name: string;
      quantity: number;
      price: number;
      compareAtPrice: number;
      discountPercent: number;
      isPopular: boolean;
    }>;
  };

  try {
    parsed = JSON.parse(data);
  } catch {
    return json({ error: "JSON invalido" }, { status: 400 });
  }

  if (!parsed.name || !parsed.tiers || parsed.tiers.length === 0) {
    return json({ error: "Nombre y al menos un tier son obligatorios" }, { status: 400 });
  }

  const bundle = await db.bundle.create({
    data: {
      shop: session.shop,
      name: parsed.name,
      title: parsed.title || parsed.name,
      type: parsed.type || "quantity_break",
      tiers: {
        create: parsed.tiers.map((t, i) => ({
          name: t.name,
          quantity: t.quantity,
          price: t.price,
          compareAtPrice: t.compareAtPrice || 0,
          discountPercent: t.discountPercent || 0,
          isPopular: t.isPopular || false,
          position: i,
        })),
      },
    },
  });

  return redirect(`/app/bundles/${bundle.id}`);
};

function TierPreviewCard({ tier, accentColor }: { tier: Tier; accentColor: string }) {
  const qty = parseInt(tier.quantity) || 0;
  const price = parseFloat(tier.price) || 0;
  const compareAt = parseFloat(tier.compareAtPrice) || 0;
  const discount = parseFloat(tier.discountPercent) || 0;

  return (
    <div
      style={{
        border: tier.isPopular ? `2px solid ${accentColor}` : "2px solid #e1e1e1",
        borderRadius: "12px",
        padding: "16px",
        position: "relative",
        background: tier.isPopular ? `${accentColor}08` : "#fff",
        transition: "all 0.2s",
      }}
    >
      {tier.isPopular && (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: accentColor,
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 12px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
          }}
        >
          MAS POPULAR
        </div>
      )}
      {discount > 0 && (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            right: "12px",
            background: "#e53935",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "4px",
          }}
        >
          {discount}% OFF
        </div>
      )}
      <div style={{ textAlign: "center", paddingTop: tier.isPopular || discount > 0 ? "4px" : 0 }}>
        <div style={{ fontWeight: 700, fontSize: "16px", color: "#111" }}>
          {tier.name || `x${qty}`}
        </div>
        <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
          {qty} {qty === 1 ? "unidad" : "unidades"}
        </div>
        <div style={{ marginTop: "8px" }}>
          {compareAt > 0 && (
            <span
              style={{
                textDecoration: "line-through",
                color: "#999",
                fontSize: "14px",
                marginRight: "6px",
              }}
            >
              ${compareAt.toLocaleString("es-AR")}
            </span>
          )}
          <span style={{ fontWeight: 800, fontSize: "22px", color: "#111" }}>
            ${price.toLocaleString("es-AR")}
          </span>
        </div>
        {qty > 0 && price > 0 && (
          <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
            ${(price / qty).toFixed(0)} c/u
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewBundlePage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const isLoading = navigation.state === "submitting";

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("quantity_break");
  const [tiers, setTiers] = useState<Tier[]>([
    { name: "Single", quantity: "1", price: "", compareAtPrice: "", discountPercent: "0", isPopular: false },
    { name: "Duo", quantity: "2", price: "", compareAtPrice: "", discountPercent: "15", isPopular: true },
    { name: "Trio", quantity: "3", price: "", compareAtPrice: "", discountPercent: "25", isPopular: false },
  ]);

  const updateTier = useCallback((index: number, field: keyof Tier, value: string | boolean) => {
    setTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        name: "",
        quantity: String(prev.length + 1),
        price: "",
        compareAtPrice: "",
        discountPercent: "0",
        isPopular: false,
      },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const payload = {
      name,
      title: title || name,
      type,
      tiers: tiers.map((t) => ({
        name: t.name,
        quantity: parseInt(t.quantity) || 1,
        price: parseFloat(t.price) || 0,
        compareAtPrice: parseFloat(t.compareAtPrice) || 0,
        discountPercent: parseFloat(t.discountPercent) || 0,
        isPopular: t.isPopular,
      })),
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    submit(formData, { method: "POST" });
  };

  const typeOptions = [
    { label: "Quantity Break (descuento por cantidad)", value: "quantity_break" },
    { label: "Multi-producto (combo de productos)", value: "multi_product" },
    { label: "Compra X Lleva Y (BXGY)", value: "bxgy" },
  ];

  const accentColor = "#2E7D32";

  return (
    <Page
      backAction={{ content: "Packs", url: "/app/bundles" }}
      title="Crear pack"
    >
      <TitleBar title="Crear pack" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {actionData && "error" in actionData && (
              <Banner tone="critical">
                <p>{actionData.error}</p>
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Informacion del pack</Text>
                <FormLayout>
                  <TextField
                    label="Nombre interno"
                    value={name}
                    onChange={setName}
                    autoComplete="off"
                    placeholder="Ej: Pack Goteros"
                    helpText="Nombre para identificar el pack en el admin"
                  />
                  <TextField
                    label="Titulo visible (storefront)"
                    value={title}
                    onChange={setTitle}
                    autoComplete="off"
                    placeholder="Ej: Elegí tu pack y ahorrá"
                    helpText="Titulo que ven tus clientes. Si esta vacio, se usa el nombre."
                  />
                  <Select
                    label="Tipo de pack"
                    options={typeOptions}
                    value={type}
                    onChange={setType}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Tiers de precio</Text>
                  <Button onClick={addTier}>Agregar tier</Button>
                </InlineStack>
                <Banner tone="info">
                  <p>Cada tier representa una opcion de compra. Configura precio, descuento y marca el mas popular.</p>
                </Banner>

                {tiers.map((tier, i) => (
                  <div key={i}>
                    {i > 0 && <Divider />}
                    <div style={{ padding: "12px 0" }}>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text as="h3" variant="headingSm">
                            Tier {i + 1}
                          </Text>
                          {tiers.length > 1 && (
                            <Button size="slim" tone="critical" onClick={() => removeTier(i)}>
                              Eliminar
                            </Button>
                          )}
                        </InlineStack>
                        <FormLayout>
                          <FormLayout.Group>
                            <TextField
                              label="Nombre"
                              value={tier.name}
                              onChange={(v) => updateTier(i, "name", v)}
                              autoComplete="off"
                              placeholder="Ej: Duo"
                            />
                            <TextField
                              label="Cantidad"
                              value={tier.quantity}
                              onChange={(v) => updateTier(i, "quantity", v)}
                              type="number"
                              autoComplete="off"
                            />
                          </FormLayout.Group>
                          <FormLayout.Group>
                            <TextField
                              label="Precio"
                              value={tier.price}
                              onChange={(v) => updateTier(i, "price", v)}
                              type="number"
                              autoComplete="off"
                              prefix="$"
                            />
                            <TextField
                              label="Precio anterior (tachado)"
                              value={tier.compareAtPrice}
                              onChange={(v) => updateTier(i, "compareAtPrice", v)}
                              type="number"
                              autoComplete="off"
                              prefix="$"
                            />
                          </FormLayout.Group>
                          <FormLayout.Group>
                            <TextField
                              label="% Descuento"
                              value={tier.discountPercent}
                              onChange={(v) => updateTier(i, "discountPercent", v)}
                              type="number"
                              autoComplete="off"
                              suffix="%"
                            />
                            <div style={{ paddingTop: "24px" }}>
                              <Checkbox
                                label="Mas popular"
                                checked={tier.isPopular}
                                onChange={(v) => updateTier(i, "isPopular", v)}
                              />
                            </div>
                          </FormLayout.Group>
                        </FormLayout>
                      </BlockStack>
                    </div>
                  </div>
                ))}
              </BlockStack>
            </Card>

            <InlineStack align="end">
              <Button variant="primary" loading={isLoading} onClick={handleSave}>
                Crear pack
              </Button>
            </InlineStack>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingSm">Vista previa</Text>
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "12px",
                  padding: "20px 16px",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "18px",
                    marginBottom: "16px",
                    color: "#111",
                  }}
                >
                  {title || name || "Elegí tu pack"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tiers.map((tier, i) => (
                    <TierPreviewCard key={i} tier={tier} accentColor={accentColor} />
                  ))}
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: "16px",
                    background: accentColor,
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  AGREGAR AL CARRITO
                </button>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
