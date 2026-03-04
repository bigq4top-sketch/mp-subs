import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";

// Endpoint temporal para actualizar credenciales MP — BORRAR después de usar
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "POST only" }, { status: 405 });
  }

  const body = await request.json();
  const { shop, accessToken, publicKey, secret } = body;

  // Simple auth para que no lo use cualquiera
  if (secret !== "tmp-update-2026") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!shop || !accessToken || !publicKey) {
    return json({ error: "Missing fields" }, { status: 400 });
  }

  const result = await db.settings.update({
    where: { shop },
    data: {
      mpAccessToken: accessToken,
      mpPublicKey: publicKey,
    },
  });

  return json({ success: true, shop: result.shop });
};
