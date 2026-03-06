import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const bundleId = url.searchParams.get("bundleId");
  const productId = url.searchParams.get("productId");

  if (!shop) {
    return json({ error: "shop parameter required" }, { status: 400, headers: corsHeaders });
  }

  // If specific bundle requested
  if (bundleId) {
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId },
      include: {
        tiers: { orderBy: { position: "asc" } },
      },
    });

    if (!bundle || bundle.shop !== shop || !bundle.active) {
      return json({ error: "Bundle no encontrado" }, { status: 404, headers: corsHeaders });
    }

    return json({
      bundle: {
        id: bundle.id,
        name: bundle.name,
        title: bundle.title,
        type: bundle.type,
        tiers: bundle.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          quantity: t.quantity,
          price: t.price,
          compareAtPrice: t.compareAtPrice,
          discountPercent: t.discountPercent,
          isPopular: t.isPopular,
        })),
      },
    }, { headers: corsHeaders });
  }

  // List all active bundles for this shop
  const where: { shop: string; active: boolean; productIds?: { contains: string } } = {
    shop,
    active: true,
  };

  // Filter by product if specified
  if (productId) {
    where.productIds = { contains: productId };
  }

  const bundles = await db.bundle.findMany({
    where,
    include: {
      tiers: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: bundles.map((b) => ({
      id: b.id,
      name: b.name,
      title: b.title,
      type: b.type,
      tiers: b.tiers.map((t) => ({
        id: t.id,
        name: t.name,
        quantity: t.quantity,
        price: t.price,
        compareAtPrice: t.compareAtPrice,
        discountPercent: t.discountPercent,
        isPopular: t.isPopular,
      })),
    })),
  }, { headers: corsHeaders });
};
