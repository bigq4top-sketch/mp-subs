import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  let body: { shop: string; bundleId: string; event: string; revenue?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON invalido" }, { status: 400, headers: corsHeaders });
  }

  const { shop, bundleId, event, revenue } = body;

  if (!shop || !bundleId || !event) {
    return json({ error: "Faltan datos obligatorios" }, { status: 400, headers: corsHeaders });
  }

  // Validate event type
  if (!["view", "conversion"].includes(event)) {
    return json({ error: "Evento invalido" }, { status: 400, headers: corsHeaders });
  }

  // Verify bundle exists and belongs to shop
  const bundle = await db.bundle.findUnique({ where: { id: bundleId } });
  if (!bundle || bundle.shop !== shop) {
    return json({ error: "Bundle no encontrado" }, { status: 404, headers: corsHeaders });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert today's stats
  const existingStat = await db.bundleStats.findFirst({
    where: {
      bundleId,
      shop,
      date: { gte: today },
    },
  });

  if (existingStat) {
    const updateData: { visitors?: { increment: number }; conversions?: { increment: number }; revenue?: { increment: number } } = {};
    if (event === "view") {
      updateData.visitors = { increment: 1 };
    } else if (event === "conversion") {
      updateData.conversions = { increment: 1 };
      if (revenue) updateData.revenue = { increment: revenue };
    }

    await db.bundleStats.update({
      where: { id: existingStat.id },
      data: updateData,
    });
  } else {
    await db.bundleStats.create({
      data: {
        bundleId,
        shop,
        visitors: event === "view" ? 1 : 0,
        conversions: event === "conversion" ? 1 : 0,
        revenue: event === "conversion" ? (revenue || 0) : 0,
        date: today,
      },
    });
  }

  return json({ success: true }, { headers: corsHeaders });
};
