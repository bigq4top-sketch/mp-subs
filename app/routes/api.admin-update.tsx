import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";

// TEMPORAL — borrar después de usar
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return json({ error: "POST only" }, { status: 405 });
  const body = await request.json();
  if (body.secret !== "tmp-update-2026") return json({ error: "Unauthorized" }, { status: 401 });

  if (body.action === "update-plans") {
    const results = [];
    for (const plan of body.plans) {
      const r = await db.plan.update({ where: { id: plan.id }, data: plan.data });
      results.push({ id: r.id, amount: r.amount, originalPrice: r.originalPrice });
    }
    return json({ success: true, results });
  }

  return json({ error: "Unknown action" }, { status: 400 });
};
